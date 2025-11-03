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
            const {request} = req.body;
            console.log("[백엔드 로그] 프론트로부터 받은 추가요청사항:", request);//추가요청사항 확인용 로그
            if (request && request.trim().length > 0) {
                saveAdditionalRequest(request.trim());
            } else {
                saveAdditionalRequest('');
            }
            const { questions, questionAnswers} = getData()//LLM에게 보낼 데이터 가져옴
            const temp = questions.map((q, i) => {
                // i는 0부터 시작하니까, 표시할 땐 +1 해서 1,2,3… 로 보이게
                const answer = (questionAnswers?.[i] ?? "").toString().trim() || "no answer";//questions랑 questionAnswers를 가져옴
                return `Q${i + 1}. ${q}\nA${i + 1}. ${answer}`;//대응되는 인덱스의 값끼리 Q질문.\nA답변. 형태로 붙여서 temp에 넣음
            });
            let LLMInputText = temp.join("\n");//배열 원소 사이에 줄바꿈을 넣은 형태로 하나의 문자열로 합쳐줌
            if (request && request.trim().length > 0) {
                LLMInputText += `\n\n추가 요청사항: ${request.trim()}`;//추가요청사항이 있었다면 LLM 입력 텍스트에 덧붙임
            }
            console.log("[LLM에 전달될 전체 입력 텍스트]\n\n", LLMInputText);//최종 입력 테스트 확인

            const response = await openai.chat.completions.create ({
                model: 'gpt-4o-mini',
                messages: [
                    {role: 'system', content: `너는 여행지를 추천하고 여행 타입을 분석하는 친절한 도우미야.
                        상냥한 말투로 대답해줘. 아래 입력(질문 10개 + 각 답변 + 추가요청사항)을 바탕으로 1) countryName: 일본, 중국, 대만, 미국, 캐나다, 프랑스, 영국, 독일, 이탈리아, 스페인 중에서만 추천. 한국어 국가명 1개,
                        2) typeSummary: 여행타입을 1~2문장 한국어 요약하고 추천 국가의 관광지 중 사용자의 스타일에 맞는 도시 설명,
                        3) tags: 한국어 해시태그 5개 내외 배열(기호 # 없이 단어만) 위 3개 키만 포함한 JSON만 반환해. 설명/코드블록/문장 금지. 오직 JSON 한 덩어리만.`},
                    {role: 'user', content: LLMInputText}
                ],
                temperature: 0.3,
            });
            const llmAnswer = response.choices[0].message.content;
            console.log("LLM 반환 결과값: ", llmAnswer);
            const parsed = JSON.parse(llmAnswer);
            console.log("\n\n[정제된 JSON 결과]", parsed);
            // Manager.cjs에 반영
            setData("countryName", parsed.countryName);
            setData("recommendation", {
                typeSummary: parsed.typeSummary,
                tags: parsed.tags,
            });
            return res.status(200).json({next: "/page3" });
        } catch (err) {
            console.error("[LLM 호출/처리 오류]:", err);
            // 실패해도 기본값으로 진행
            return res.status(200).json({ next: "/page3" });
        }
    });


    module.exports=router;