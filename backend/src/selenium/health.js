import { Builder } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome.js';

export async function verificarSaudeSelenium() {
    const options = new Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.binaryLocation = '/usr/bin/chromium-browser';

    let driver;
    
    try {
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        await driver.quit();

        return {
            status: 'ok',
            mensagem: 'Selenium está funcionando corretamente'
        };
    } catch (error) {
        return {
            status: 'erro',
            erro: error.message,
            stack: error.stack,
            mensagem: 'Falha na verificação de saúde do Selenium'
        };
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
} 