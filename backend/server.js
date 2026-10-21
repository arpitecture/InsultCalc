require("dotenv").config();
const express=require("express");
const { GoogleGenAI } = require("@google/genai");
const path = require("path");

const app=express();
app.use(express.json());
app.use("/roast", rateLimit({
    windowMs: 60 * 1000,   
    max: 10,               
    message: { error: "slow down" },
}));

app.set("trust proxy", 1); 
app.use(express.static(path.join(__dirname, "../frontend")));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const recentRoasts = [];

app.post("/roast",async (req,res)=>{
    console.log("hit /roast with", req.body);
    const {a ,op ,b}=req.body;

    if (isNaN(Number(a)) || isNaN(Number(b)) || !["+", "-", "*", "/"].includes(op)) {
        return res.status(400).json({ error: "bad input" });
    }

    const prompt = `The user asked you to compute ${Number(a)} ${op} ${Number(b)}, which is trivially easy.
                    Insult them in one or two sentences, specific to these exact numbers. Keep it playful and aimed at the sum,go personal if you have to.
                    Don't reuse the themes or phrasing of these earlier roasts: ${JSON.stringify(recentRoasts.slice(-5))}`; 
    
    try{
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are a snobbish, egotistical calculator who finds easy arithmetic beneath you. Reply with only the insult, no preamble.",
                temperature: 1,
            },
        });
        const roast = response.text.trim();
        recentRoasts.push(roast);
        res.json({ roast });
    }catch(err){
        console.error("GEMINI ERROR:", err);
        res.status(500).json({ error: "roast failed" });
        
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));