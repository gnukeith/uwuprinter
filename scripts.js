const emojis = {
    // Kawaiii emojis
    cpu: "🧠",
    memory: "💾",
    gpu: "🎮",
    screen: "🖥️",
    extensions: "🧩",
    browser: "🌐",
    os: "⚙️",
    battery: "🔋",
    network: "📡"
};

async function getRefreshRate() {
    try {
        // First try the modern Screen API
        if (window.screen.refresh) {
            return window.screen.refresh;
        }
        
        // Fallback method using requestAnimationFrame
        let refreshRate = 0;
        let times = [];
        
        return new Promise(resolve => {
            const measure = timestamp => {
                times.push(timestamp);
                
                if (times.length < 20) {
                    requestAnimationFrame(measure);
                } else {
                    // Calculate average frame time
                    let avgFrameTime = 0;
                    for (let i = 1; i < times.length; i++) {
                        avgFrameTime += times[i] - times[i-1];
                    }
                    avgFrameTime /= (times.length - 1);
                    
                    // Convert to refresh rate
                    refreshRate = Math.round(1000 / avgFrameTime);
                    resolve(refreshRate);
                }
            };
            requestAnimationFrame(measure);
        });
    } catch (error) {
        console.error('Error getting refresh rate:', error);
        return 'N/A';
    }
}

async function getExtensionsCount() {
    try {
        // Chrome/Edge extension detection
        if (chrome?.runtime?.getManifest) {
            return new Promise(resolve => {
                chrome.management?.getAll(extensions => {
                    resolve(extensions?.length || 'N/A');
                }) || resolve('N/A');
            });
        }
        
        // Firefox extension detection
        if (browser?.runtime?.getManifest) {
            return new Promise(resolve => {
                browser.management?.getAll(extensions => {
                    resolve(extensions?.length || 'N/A');
                }) || resolve('N/A');
            });
        }
        
        return 'N/A';
    } catch (error) {
        console.error('Error getting extensions count:', error);
        return 'N/A';
    }
}

async function getGPUInfo() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            return 'WebGL not supported';
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            return {
                vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            };
        }
        
        return 'GPU info not available';
    } catch (error) {
        console.error('Error getting GPU info:', error);
        return 'Error getting GPU info';
    }
}

async function getScreenInfo() {
    try {
        const refreshRate = await getRefreshRate();
        return {
            width: window.screen.width,
            height: window.screen.height,
            colorDepth: window.screen.colorDepth,
            refreshRate: refreshRate,
            pixelRatio: window.devicePixelRatio
        };
    } catch (error) {
        console.error('Error getting screen info:', error);
        return null;
    }
}

async function getPerformanceInfo() {
    // ... existing getPerformanceInfo code ...
}

async function getSystemInfo() {
    const perfInfo = await getPerformanceInfo();
    const gpuInfo = await getGPUInfo();
    const screenInfo = await getScreenInfo();
    const extensionsCount = await getExtensionsCount();
    
    const systemCards = [
        createInfoCard('CPU Cores', perfInfo.cpuCores, emojis.cpu),
        createInfoCard('Memory',
            perfInfo.memory ? `${perfInfo.memory.used}MB / ${perfInfo.memory.total}MB` : 'N/A',
            emojis.memory,
            [`Platform: ${perfInfo.platform}`]
        ),
        createInfoCard('GPU',
            typeof gpuInfo === 'string' ? gpuInfo : gpuInfo.renderer,
            emojis.gpu,
            typeof gpuInfo === 'string' ? [] : [`Vendor: ${gpuInfo.vendor}`]
        ),
        createInfoCard('Screen',
            `${screenInfo.width}x${screenInfo.height}`,
            emojis.screen,
            [
                `Refresh Rate: ${screenInfo.refreshRate}Hz`,
                `Color Depth: ${screenInfo.colorDepth}bit`,
                `Pixel Ratio: ${screenInfo.pixelRatio}`
            ]
        ),
        createInfoCard('Extensions',
            extensionsCount,
            emojis.extensions
        )
    ];

    const container = document.getElementById('system-info');
    container.innerHTML = '';
    systemCards.forEach(card => container.appendChild(card));
    
    // Update every 5 seconds
    setTimeout(getSystemInfo, 5000);
}

function createInfoCard(title, value, emoji, details = []) {
    const card = document.createElement('div');
    card.className = 'info-card';
    
    card.innerHTML = `
        <h3>${emoji} ${title}</h3>
        <p class="value">${value}</p>
        ${details.map(detail => `<p class="detail">${detail}</p>`).join('')}
    `;
    
    return card;
}

window.onload = getSystemInfo;