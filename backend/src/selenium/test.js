import { Builder, By, until } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome.js';

export async function testarSelenium() {
    console.log('Iniciando teste do Selenium...');
    
    const options = new Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    options.binaryLocation = '/usr/bin/chromium-browser';

    console.log('Iniciando driver...');
    let driver;
    
    try {
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        console.log('Driver iniciado com sucesso');

        // Testar navegação para o site
        console.log('Navegando para o site...');
        await driver.get('http://frontend:80');
        
        // Verificar se a página carregou
        const title = await driver.getTitle();
        console.log('Título da página:', title);

        // Verificar se o formulário de login está presente
        console.log('Verificando formulário de login...');
        const loginForm = await driver.findElement(By.className('auth-form'));
        console.log('Formulário de login encontrado');

        // Verificar campos do formulário
        const emailInput = await loginForm.findElement(By.id('email'));
        const passwordInput = await loginForm.findElement(By.id('password'));
        console.log('Campos do formulário encontrados');

        // Verificar botão de login
        console.log('Verificando botão de login...');
        const loginButton = await driver.findElement(By.xpath("//button[contains(text(), 'Entrar')]"));
        console.log('Botão de login encontrado');

        // Verificar se o site está funcionando
        const isSiteWorking = title.includes('Central de Oportunidades');
        console.log('Site está funcionando:', isSiteWorking);

        console.log('Teste concluído com sucesso');
        return {
            sucesso: true,
            titulo: title,
            siteFuncionando: isSiteWorking,
            mensagem: 'Teste do Selenium concluído com sucesso'
        };
    } catch (error) {
        console.error('Erro detalhado no teste do Selenium:', error);
        return {
            sucesso: false,
            erro: error.message,
            stack: error.stack,
            mensagem: 'Falha no teste do Selenium'
        };
    } finally {
        if (driver) {
            console.log('Fechando driver...');
            await driver.quit();
        }
    }
} 