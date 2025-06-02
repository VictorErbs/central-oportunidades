import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

export async function exemploScraping() {
    // Configurar opções do Chrome para Docker
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    options.binaryLocation = process.env.CHROME_BIN || '/usr/bin/chromium-browser';

    // Inicializar o driver
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        // Exemplo de navegação
        await driver.get('https://exemplo.com');
        
        // Exemplo de espera e interação
        const elemento = await driver.wait(
            until.elementLocated(By.css('.classe-exemplo')),
            10000
        );
        
        // Exemplo de extração de dados
        const texto = await elemento.getText();
        console.log('Texto encontrado:', texto);

        return texto;
    } catch (error) {
        console.error('Erro durante o scraping:', error);
        throw error;
    } finally {
        // Sempre fechar o driver
        await driver.quit();
    }
} 