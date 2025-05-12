const fetch = require('node-fetch'); // 确认安装 node-fetch

const API_KEY = process.env.GEMINI_API_KEY;  // 你的真实 API Key

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`);
        const data = await response.json();
        console.log('完整返回结果:', JSON.stringify(data, null, 2));  // 👈打印全部内容
        if (data.models) {
            console.log('可用模型列表：', data.models.map(m => m.name));
        } else {
            console.error('出错了，返回没有 models 字段:', data);
        }
    } catch (error) {
        console.error('请求失败：', error);
    }
}

listModels();
