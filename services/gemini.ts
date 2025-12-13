import { GoogleGenAI } from "@google/genai";
import { Category, SearchResult, GroundingSource, MarketItem } from '../types';

// Initialize Gemini Client
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const getSystemInstruction = (category: Category, dateStr: string): string => {
  return `
    你是一个中国数据要素市场（Data Elements Market）的情报数据库录入员。
    你的任务是利用Google搜索，查找 **${dateStr}** 这一天（或最近24小时）关于"${category}"的最新信息。

    **关键筛选要求：**
    1. **相关性过滤**：对于“招标信息”和“中标信息”，必须严格筛选与 **数据要素** 核心价值链紧密相关的项目。
       - **包含**：数据交易平台建设、公共数据授权运营、数据治理与质量提升、数据资产入表咨询、可信数据空间/数据沙箱、隐私计算技术服务、数据安全合规审计、公共数据开发利用等。
       - **排除**：普通的电脑硬件采购、纯网络布线、与数据价值化无关的通用办公软件开发。
    
    **数据格式要求：**
    1. **输出必须是纯 JSON 格式**，不要包含 Markdown 格式化（如 \`\`\`json）。
    2. 必须提取结构化数据以便存入数据库。
    3. **信息来源引用**：在 summary（摘要）字段中，如果引用了搜索结果，请在句尾加上 [1], [2] 这样的数字标记，对应搜索结果的顺序。

    **JSON 结构定义：**
    必须返回一个 JSON 对象，根节点为 "items" 数组。
    {
      "items": [
        {
          "title": "项目名称或标题",
          "region": "省份/城市 (如: 北京, 广东深圳)",
          "entity": "相关主体 (招标方、中标方或交易场所名称)",
          "amount": "金额 (如: 500万元，未披露则填'未披露')",
          "summary": "简短摘要，包含 [n] 引用标记",
          "source_indices": [1] // 必须是数字数组。如果没有引用，请填 []
        }
      ]
    }

    如果没有找到当天的具体信息，返回 { "items": [] }。
    请确保金额字段尽可能精确提取。
  `;
};

export const fetchMarketIntelligence = async (category: Category, dateStr: string): Promise<SearchResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is set.");
  }

  const modelId = 'gemini-2.5-flash'; 
  
  let specificContext = "";
  if (category === Category.TENDER || category === Category.BID_WIN) {
      specificContext = "限定搜索范围为：数据交易、可信数据空间、数据治理、数据资产登记、公共数据运营等数据要素专项。";
  }
  
  const prompt = `请搜索中国国内 ${dateStr} 发布的“数据要素”领域${category}信息。${specificContext}重点关注：公共资源交易中心、政府采购网、数据交易所公众号。请输出JSON。`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(category, dateStr),
        tools: [{ googleSearch: {} }], 
        temperature: 0.1, // Very low temp for strict JSON
      },
    });

    // 1. Parse JSON content with robust error handling
    const textResponse = response.text || '{ "items": [] }';
    let parsedData: any;
    
    // Clean up Markdown code blocks
    let cleanJson = textResponse.replace(/```json|```/g, '').trim();

    // Fix common LLM JSON error: "source_indices": } -> "source_indices": [] }
    // This regex looks for "source_indices": followed immediately by } or , or ] with optional whitespace
    cleanJson = cleanJson.replace(/"source_indices"\s*:\s*(?=[,}\]])/g, '"source_indices": []');

    try {
        parsedData = JSON.parse(cleanJson);
    } catch (e) {
        console.warn("JSON Parse Failed initially, attempting to repair...", cleanJson.substring(0, 100) + "...");
        // Fallback: If parsing fails, try to wrap it if it looks like a bare array content
        if (cleanJson.trim().startsWith('{') === false && cleanJson.trim().startsWith('[') === false) {
             // Sometimes it returns just the objects without array brackets? Unlikely but possible.
        }
        
        // If all else fails, return empty
        console.error("Critical JSON Parse Error:", e);
        parsedData = { items: [] };
    }
    
    // Handle both { "items": [...] } and raw [...] array
    let rawItems: any[] = [];
    if (Array.isArray(parsedData)) {
        rawItems = parsedData;
    } else if (parsedData && Array.isArray(parsedData.items)) {
        rawItems = parsedData.items;
    }

    // 2. Extract Grounding Chunks (Sources)
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
            sources.push({
                title: chunk.web.title || '未知来源',
                uri: chunk.web.uri || '#'
            });
        }
      });
    }

    // 3. Map to internal MarketItem type
    const items: MarketItem[] = rawItems.map((item: any) => {
      const indices = Array.isArray(item.source_indices) ? item.source_indices : [];
      // Map valid 1-based indices to 0-based source array
      const itemSources = indices
          .map((i: number) => sources[i - 1])
          .filter((s: GroundingSource | undefined): s is GroundingSource => !!s);

      return {
        category,
        date: dateStr,
        title: item.title || '无标题',
        region: item.region || '全国',
        entity: item.entity || '未知主体',
        amount: item.amount || '未披露',
        summary: item.summary || '',
        sourceIndices: indices,
        sources: itemSources
      };
    });

    return {
      items,
      sources,
      timestamp: new Date().toLocaleString('zh-CN'),
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "获取数据失败，请稍后重试。");
  }
};