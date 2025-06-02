import express from 'express';
import { testarSelenium } from '../selenium/test.js';
import { verificarSaudeSelenium } from '../selenium/health.js';

const router = express.Router();

router.get('/health', async (req, res) => {
    try {
        const resultado = await verificarSaudeSelenium();
        res.json(resultado);
    } catch (error) {
        console.error('Erro na rota de saúde:', error);
        res.status(500).json({
            status: 'erro',
            erro: error.message,
            stack: error.stack,
            mensagem: 'Erro ao verificar saúde do Selenium'
        });
    }
});

router.get('/test', async (req, res) => {
    try {
        console.log('Iniciando requisição de teste do Selenium');
        const resultado = await testarSelenium();
        console.log('Resultado do teste:', resultado);
        
        if (!resultado.sucesso) {
            return res.status(500).json(resultado);
        }
        
        res.json(resultado);
    } catch (error) {
        console.error('Erro na rota de teste:', error);
        res.status(500).json({
            sucesso: false,
            erro: error.message,
            stack: error.stack,
            mensagem: 'Erro ao executar teste do Selenium'
        });
    }
});

export default router; 