const http = require('http');
const readline = require('readline');

// State
let currentCommand = null;

// Create HTTP server
const server = http.createServer((req, res) => {
    // Enable CORS for React Native
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/command' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ command: currentCommand }));
    } else if (req.url === '/clear' && req.method === 'POST') {
        currentCommand = null;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log('\n========================================');
    console.log('📞 Call Testing Script Running');
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log('========================================\n');
    console.log('Available commands:');
    console.log('  call    - Trigger incoming call');
    console.log('  hangup  - End the call');
    console.log('  status  - Show current state');
    console.log('  clear   - Clear current command');
    console.log('  exit    - Exit the script\n');
    console.log('Waiting for commands...\n');
});

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});

rl.prompt();

rl.on('line', (line) => {
    const input = line.trim().toLowerCase();

    switch (input) {
        case 'call':
            currentCommand = 'call';
            console.log('✅ Command set: INCOMING CALL');
            console.log('   The app will receive this command within 2 seconds\n');
            break;

        case 'hangup':
            currentCommand = 'hangup';
            console.log('✅ Command set: HANGUP');
            console.log('   The app will end the call\n');
            break;

        case 'status':
            console.log(`📊 Current command: ${currentCommand || 'None'}\n`);
            break;

        case 'clear':
            currentCommand = null;
            console.log('🧹 Command cleared\n');
            break;

        case 'exit':
            console.log('👋 Exiting...\n');
            process.exit(0);
            break;

        case 'help':
            console.log('\nAvailable commands:');
            console.log('  call    - Trigger incoming call');
            console.log('  hangup  - End the call');
            console.log('  status  - Show current state');
            console.log('  clear   - Clear current command');
            console.log('  exit    - Exit the script\n');
            break;

        default:
            if (input) {
                console.log(`❌ Unknown command: "${input}"`);
                console.log('   Type "help" for available commands\n');
            }
            break;
    }

    rl.prompt();
});

rl.on('close', () => {
    console.log('\n👋 Exiting...\n');
    process.exit(0);
});
