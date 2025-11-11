// ── GiftTripPages02.cjs 최상단(또는 server.cjs 최상단) ──
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'), // nodejs/ 상위의 .env를 명시
});

const express = require('express');
    const {getData, setData, saveAdditionalRequest} = require('./Manager.cjs');
    const router = express.Router();

    const { OpenAI } = require('openai');
    const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

    //추가요청사항 입력 및 저장
    router.post('/request', async (req, res) => {
      try {
        const { request } = req.body || {};
        console.log("[백엔드 로그] 프론트로부터 받은 추가요청사항:", request);
    
        // 추가요청 저장 (비어있으면 공백 저장)
        saveAdditionalRequest((request && request.trim()) ? request.trim() : "");
    
        // LLM 입력용 Q/A 문자열 생성
        const { questions, questionAnswers } = getData(); // ✅ 기존 저장된 질문/답변 사용
        const qaLines = questions.map((q, i) => {
          const answer = (questionAnswers?.[i] ?? "").toString().trim() || "no answer";
          return `Q${i + 1}. ${q}\nA${i + 1}. ${answer}`;
        });
        let LLMInputText = qaLines.join("\n");
        if (request && request.trim().length > 0) {
          LLMInputText += `\n\n추가 요청사항: ${request.trim()}`;
        }
        console.log("[LLM에 전달될 전체 입력 텍스트]\n\n", LLMInputText);
    
        // ✅ JSON Schema 기반 구조화 출력 (strict)
        const response = await openai.chat.completions.create({
          model: "gpt-5-mini",
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "TravelRecommendation",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  countryName: { type: "string" },
                  countryCode: { type: "string", pattern: "^[A-Z]{2}$" },
                  typeSummary: { type: "string" },
                  tags: {
                    type: "array",
                    minItems: 3,
                    maxItems: 6,
                    items: { type: "string" }
                  }
                },
                required: ["countryName", "countryCode", "typeSummary", "tags"]
              }
            }
          },
          messages: [
            {
              role: "system",
              content: `너는 여행지를 추천하고 여행 타입을 분석하는 친절한 도우미야.  
                        상냥하고 활기찬 말투로 대답해줘.  
                        아래 입력은 질문과 사용자의 답변, 그리고 추가 요청사항이야.  
                        이 정보를 바탕으로 사용자의 여행 성향을 분석하고,  
                        10개 국가 중에서 가장 적합한 하나의 여행지를 추천해줘.

                        🗺️ [추천 가능 국가 목록]  
                        일본, 중국, 대만, 미국, 캐나다, 스페인, 프랑스, 이탈리아, 독일, 영국

                        <여행타입 및 해시태그용 보조 질문은 국가 추천에 절대 절대 영향을 미치지 않음>
                        보조 질문: 제일 마지막 두 개의 질문(혼자 여행 / 계획형 여행)
                        
                        [특수 케이스]
                        혼자 여행 / 계획형 여행 질문 제외 총 14개 질문의 답변 중에서 yes가 10개 이상인 경우,
                        다양한 성향을 모두 즐길 수 있는 종합형 여행 국가(예: 미국, 일본, 프랑스, 이탈리아 중 하나)를 선택해줘.
                        혼자 여행 / 계획형 여행 질문 제외 총 14개 질문의 답변 중에서 yes가 3개 이하인 경우, 일본을 추천해줘.

                        🧩 [추천 방식] 
                        1. “추가 요청사항(특정 국가/대륙 제외 또는 선호 or 질문에 대한 답변에 반대되는 요청 등)”은 반드시 **최우선순위**로 반영하고, 기존 추천 예정 내용을 모두 무시해.
                        즉, 질문에 대한 답변보다 사용자의 구체적 요청사항을 더 우선시해야 해.  
                        2. 추천 국가는 반드시 언급한 10개 목록 중 하나여야 해
                        3. 질문/답변 가운데 모순되는 내용이 존재하는 경우, 오래 생각하지 말고 모순되지 않는 나머지 사항을 고려해서 바로 결정해.
                        4. 혼자 여행 / 계획형 여행 관련 질문은 여행지 추천에 영향을 주지 않고  
                        “여행 타입(typeSummary)”과 “해시태그(tags)” 생성 시만 활용해.
                        5. 추천 국가를 추천하는 이유를 한 문장을 넘어가지 않게 기술해.
                        ---

                        📦 [출력 형식]
                        오직 아래 형식의 JSON만 반환해.  
                        설명, 코드블록, 문장, 기타 텍스트는 절대 포함하지 말고 JSON 한 덩어리로 출력해.  

                        {
                        "countryName": "<추천 국가명 (한국어), 추가요청사항이 있는 경우 반드시 추가요청사항을 따른다.>",
                        "countryCode": "<추천 국가 코드 2자리, 예: 일본: JP, 이탈리아: IT>",
                        "typeSummary": "<1~2문장으로 사용자의 여행 타입을 간략하게 분석한다.
                        추천 국가를 선택한 이유를 사용자의 yes 답변 중 해당 국가와 관련된 질문들을 중심으로 자연스럽게 풀어쓴다. 이때, 관광지는 명시하지 않되 추천 국가의 대표급 대도시는 자연스럽게 언급할 수 있다.>",
                        "tags": ["단어1", "단어2", "단어3", "단어4", "단어5"] {예외사항: 태그가 늘어나면 늘어난 개수만큼 단어6 단어7 늘려줘}
                        "yes_count": "<'혼자 여행'과 '계획형 여행'을 제외한 질문에서 사용자가 'yes'라고 답한 개수를 정확한 정수로만 반환.>"
                        }`
            },
            {
              role: "user",
              content: `아래는 질문-답변과 추가요청사항이야. 이를 바탕으로 추천해줘.\n\n${LLMInputText}`
            }
          ]
        });
    
        // ✅ JSON Schema 모드라 content가 스키마에 맞는 단일 JSON
        const raw = response.choices?.[0]?.message?.content || "{}";
        console.log("LLM 반환 결과값:", raw);
    
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          console.error("JSON 파싱 실패:", e);
          throw new Error("LLM JSON parse error");
        }
    
        // ✅ 필드 2차 검증 (방어)
        const ok =
          parsed &&
          typeof parsed.countryName === "string" &&
          /^[A-Z]{2}$/.test(parsed.countryCode || "") &&
          typeof parsed.typeSummary === "string" &&
          Array.isArray(parsed.tags);
    
        if (!ok) {
          throw new Error("LLM schema validation failed");
        }
    
        // ✅ 상태 반영
        setData("countryName", parsed.countryName);
        setData("countryCode", parsed.countryCode);
        setData("recommendation", {
          typeSummary: parsed.typeSummary,
          tags: parsed.tags,
        });
    
        return res.status(200).json({ next: "/page3" });
      } catch (err) {
        console.error("[LLM 호출/처리 오류]:", err);
        // 실패해도 기본값으로 진행
        return res.status(200).json({ next: "/page3" });
      }
    });


    module.exports=router;