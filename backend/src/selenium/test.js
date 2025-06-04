import { Builder, By, until } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome.js';

export async function testarSelenium() {
    const options = new Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    options.binaryLocation = '/usr/bin/chromium-browser';

    let driver;
    
    try {
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        await driver.get('http://frontend:80');
        
        const title = await driver.getTitle();

        const loginForm = await driver.findElement(By.className('auth-form'));

        const emailInput = await loginForm.findElement(By.id('email'));
        const passwordInput = await loginForm.findElement(By.id('password'));

        const loginButton = await driver.findElement(By.xpath("//button[contains(text(), 'Entrar')]"));

        const isSiteWorking = title.includes('Central de Oportunidades');

        return {
            sucesso: true,
            titulo: title,
            siteFuncionando: isSiteWorking,
            mensagem: 'Teste do Selenium concluído com sucesso'
        };
    } catch (error) {
        return {
            sucesso: false,
            erro: error.message,
            stack: error.stack,
            mensagem: 'Falha no teste do Selenium'
        };
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
} 