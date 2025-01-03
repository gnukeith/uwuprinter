// Kawaii System Info Checker ✨
const emojis = {
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

async function getCPUInfo() {
    try {
        // Get basic CPU information
        const cores = navigator.hardwareConcurrence || 'N/A';
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;

        // Parse CPU information from user agent
        let cpuDetails = {
            cores,
            threads: cores, // Logical processors (cores * threads per core)
            architecture: platform.includes('64') ? '64-bit' : '32-bit',
            vendor: 'Unknown',
            model: 'Unknown',
            features: []
        };

        // Try to detect CPU vendor and model
        const uaString = userAgent.toLowerCase();
        if (uaString.includes('intel')) {
            cpuDetails.vendor = 'Intel';
            // Try to extract Intel CPU model
            const intelMatch = uaString.match(/intel\s+([^;\)]+)/i);
            if (intelMatch) {
                cpuDetails.model = intelMatch[1];
            }
        } else if (uaString.includes('amd')) {
            cpuDetails.vendor = 'AMD';
            // Try to extract AMD CPU model
            const amdMatch = uaString.match(/amd\s+([^;\)]+)/i);
            if (amdMatch) {
                cpuDetails.model = amdMatch[1];
            }
        } else if (uaString.includes('apple')) {
            cpuDetails.vendor = 'Apple';
            if (uaString.includes('apple silicon')) {
                cpuDetails.model = 'Apple Silicon';
            }
        }

        // Detect CPU features using feature detection
        const features = [];
        
        // Check for SIMD support
        if (typeof WebAssembly !== 'undefined' && WebAssembly.validate) {
            features.push('WASM Support');
        }

        // Check for SharedArrayBuffer (indicates multi-threading support)
        if (typeof SharedArrayBuffer !== 'undefined') {
            features.push('Multi-threading Support');
        }

        // Check for various Web APIs that indicate CPU capabilities
        if ('wakeLock' in navigator) {
            features.push('Wake Lock');
        }
        
        if ('serviceWorker' in navigator) {
            features.push('Service Workers');
        }

        // Attempt to measure rough CPU performance
        let performanceScore = await measureCPUPerformance();
        
        cpuDetails.features = features;
        cpuDetails.performanceScore = performanceScore;

        return cpuDetails;
    } catch (error) {
        console.error('Error getting CPU info:', error);
        return null;
    }
}

async function measureCPUPerformance() {
    try {
        const startTime = performance.now();
        let result = 0;
        
        // Perform a CPU-intensive calculation
        for (let i = 0; i < 1000000; i++) {
            result += Math.sqrt(i) * Math.sin(i);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Normalize score between 0-100
        return Math.min(100, Math.round(10000 / duration));
    } catch (error) {
        return 'N/A';
    }
}

async function getPerformanceInfo() {
    try {
        const memory = performance.memory ? {
            total: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
            used: Math.round(performance.memory.usedJSHeapSize / 1048576)
        } : null;
        
        const cpuInfo = await getCPUInfo();
        
        return {
            memory,
            cpuInfo,
            platform: navigator.platform
        };
    } catch (error) {
        console.error('Error getting performance info:', error);
        return null;
    }
}

async function getRefreshRate() {
    try {
        if (window.screen.refresh) {
            return window.screen.refresh;
        }
        
        let times = [];
        return new Promise(resolve => {
            const measure = timestamp => {
                times.push(timestamp);
                if (times.length < 20) {
                    requestAnimationFrame(measure);
                } else {
                    let avgFrameTime = times.reduce((acc, time, i) => {
                        return i === 0 ? acc : acc + (time - times[i-1]);
                    }, 0) / (times.length - 1);
                    resolve(Math.round(1000 / avgFrameTime));
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
        if (typeof chrome !== 'undefined' && chrome?.runtime?.getManifest) {
            return new Promise(resolve => {
                if (chrome?.management?.getAll) {
                    chrome.management.getAll(extensions => {
                        resolve(extensions?.length || 'N/A');
                    });
                } else {
                    resolve('N/A');
                }
            });
        }
        
        if (typeof browser !== 'undefined' && browser?.runtime?.getManifest) {
            return new Promise(resolve => {
                if (browser?.management?.getAll) {
                    browser.management.getAll(extensions => {
                        resolve(extensions?.length || 'N/A');
                    });
                } else {
                    resolve('N/A');
                }
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

function createInfoCard(title, value, emoji, details = []) {
    const card = document.createElement('div');
    card.className = 'info-card';
    
    const content = `
        <div class="section-title">
            <span class="emoji">${emoji}</span>
            ${title}
        </div>
        <div class="value">${value}</div>
        ${details.map(detail => `
            <div class="sub-info">${detail}</div>
        `).join('')}
    `;
    
    card.innerHTML = content;
    return card;
}

async function getSystemInfo() {
    try {
        const perfInfo = await getPerformanceInfo();
        const gpuInfo = await getGPUInfo();
        const screenInfo = await getScreenInfo();
        const extensionsCount = await getExtensionsCount();

        const systemCards = [
            createInfoCard('CPU Info', 
                `${perfInfo.cpuInfo.vendor} ${perfInfo.cpuInfo.model}`,
                emojis.cpu,
                [
                    `Cores: ${perfInfo.cpuInfo.cores}`,
                    `Architecture: ${perfInfo.cpuInfo.architecture}`,
                    `Performance Score: ${perfInfo.cpuInfo.performanceScore}/100`,
                    `Features: ${perfInfo.cpuInfo.features.join(', ')}`
                ]
            ),
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

        const container = document.getElementById('systemInfo');
        container.innerHTML = '';
        systemCards.forEach(card => container.appendChild(card));
    } catch (error) {
        console.error('Error updating system info:', error);
    }
}

// Initialize on page load
window.onload = () => {
    getSystemInfo();
    // Update every 5 seconds
    setInterval(getSystemInfo, 5000);
};