(function () {
    const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    const numberChars = "0123456789";
    const specialChars = "@_-.";
    const passwordLength = 12;
    let currentPassword = '';
    let isPinVerified = false;

    function generatePassword() {
        let password = '';
        password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
        password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
        password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
        password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
        password += numberChars[Math.floor(Math.random() * numberChars.length)];
        password += numberChars[Math.floor(Math.random() * numberChars.length)];
        password += specialChars[Math.floor(Math.random() * specialChars.length)];
        password += specialChars[Math.floor(Math.random() * specialChars.length)];

        const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
        for (let i = password.length; i < passwordLength; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    function matchesPattern(value, patterns) {
        return patterns.some(pattern => new RegExp(pattern, 'i').test(value));
    }

    function detectPasswordFields() {
        const passwordIndicators = [
            'password', 'passwd', 'pass', 'user_password', 'new_password',
            'confirm_password', 'password_confirmation', 'retype_password', 
            'password2', 'verify_password'
        ];
        const confirmKeywords = ['confirm', 'verify', 'retype', 'repeat', 're-enter'];

        const fields = document.querySelectorAll('input[type="password"], input');

        const detectedFields = [];

        fields.forEach(input => {
            const type = input.getAttribute('type') || '';
            const name = input.getAttribute('name') || '';
            const id = input.getAttribute('id') || '';
            const placeholder = input.getAttribute('placeholder') || '';
            const ariaLabel = input.getAttribute('aria-label') || '';
            const className = input.className || '';
            const dataAttrs = Object.entries(input.dataset).map(([key, val]) => `${key}:${val}`).join(' ');

            const combinedText = `${type} ${name} ${id} ${placeholder} ${ariaLabel} ${className} ${dataAttrs}`.toLowerCase();

            if (type === 'password' || passwordIndicators.some(indicator => combinedText.includes(indicator))) {
                detectedFields.push(input);
            }
        });

        const labels = document.querySelectorAll('label[for]');
        labels.forEach(label => {
            const text = label.textContent.trim().toLowerCase();
            if (text.includes('password')) {
                const targetId = label.getAttribute('for');
                const field = document.getElementById(targetId);
                if (field && !detectedFields.includes(field)) {
                    detectedFields.push(field);
                }
            }
        });

        return detectedFields;
    }

    function fillFields(fields, password) {
        if (!isPinVerified) {
            return;
        }

        fields.forEach(field => {
            field.value = password;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.dispatchEvent(new Event('blur', { bubbles: true }));
        });
    }

    const militaryPools = {
        uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        lowercase: "abcdefghijklmnopqrstuvwxyz",
        numbers: "0123456789",
        special1: "@",
        special2: "#"
    };

    function generateMilitaryPassword(domain, pin, month, year, nickname) {
        const baseSeed = generateMilitarySeed(domain, pin, month, year, nickname);
        const seeds = [
            militaryHash(baseSeed + "1"),
            militaryHash(baseSeed + "2"),
            militaryHash(baseSeed + "3"),
            militaryHash(baseSeed + "4")
        ];

        const randoms = seeds.map(seed => {
            let value = seed;
            return (min, max) => {
                value = ((value * 6364136223846793005) + 1442695040888963407) % 2**64;
                return min + (value % (max - min + 1));
            };
        });

        let password = [];
        const requirements = {
            uppercase: 1,
            lowercase: 1,
            numbers: 1,
            special1: 1,
            special2: 1
        };

        for (const [type, count] of Object.entries(requirements)) {
            const randomIndex = militaryHash(type) % randoms.length;
            const random = randoms[randomIndex];
            
            const pool = militaryPools[type];
            
            for (let i = 0; i < count; i++) {
                const positionSeed = militaryHash(baseSeed + type + i);
                const positionRandom = ((positionSeed * 6364136223846793005) + 1442695040888963407) % 2**64;
                const index = (positionRandom % pool.length);
                const char = pool[index];
                const position = positionRandom % 12;
                password.push({
                    char: char,
                    position: position
                });
            }
        }

        while (password.length < 12) {
            const randomIndex = militaryHash(baseSeed + password.length) % randoms.length;
            const random = randoms[randomIndex];
            
            const poolTypes = ['uppercase', 'lowercase', 'numbers', 'special1', 'special2'];
            const poolType = poolTypes[random(0, poolTypes.length - 1)];
            const pool = militaryPools[poolType];
            
            const positionSeed = militaryHash(baseSeed + "fill" + password.length);
            const positionRandom = ((positionSeed * 6364136223846793005) + 1442695040888963407) % 2**64;
            const index = (positionRandom % pool.length);
            const char = pool[index];
            const position = positionRandom % 12;
            
            password.push({
                char: char,
                position: position
            });
        }

        password.sort((a, b) => a.position - b.position);
        const finalPassword = password.map(p => p.char).join('');

        return finalPassword;
    }

    function militaryHash(str) {
        let hash = 0;
        const rounds = 9;
        
        for (let round = 0; round < rounds; round++) {
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 19) | (hash >>> 13)) ^ char;
                hash = (hash * 41) + char;
                hash = hash ^ (hash << 13);
                hash = hash + (hash << 7);
                hash = hash ^ (hash >> 23);
                hash = hash + (hash << 11);
                hash = hash ^ (i * round * 0x9E3779B9);
            }
            hash = hash ^ (round * 0x9E3779B9);
        }
        
        return Math.abs(hash);
    }

    function generateMilitarySeed(domain, pin, month, year, nickname) {
        const components = [
            domain,
            pin.padStart(8, '0'),
            month.toString().padStart(2, '0'),
            year.toString(),
            nickname
        ];
        
        const salt = components.join('|');
        return militaryHash(salt).toString(36) + salt;
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updatePassword') {
            currentPassword = request.password;
            isPinVerified = true;
            const fields = detectPasswordFields();
            fillFields(fields, currentPassword);
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        const passwordFields = detectPasswordFields();
        if (passwordFields.length > 0) {
            chrome.runtime.sendMessage({ action: 'passwordFieldsDetected' });
        }
    });

    setTimeout(() => {
        const passwordFields = detectPasswordFields();
        if (passwordFields.length > 0) {
            chrome.runtime.sendMessage({ action: 'passwordFieldsDetected' });
        }
    }, 1000);
})();
