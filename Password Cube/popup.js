document.addEventListener('DOMContentLoaded', function() {

    const passwordDisplay = document.getElementById('passwordDisplay');
    const domainElement = document.getElementById('domain');
    const pinInput = document.getElementById('pinInput');
    const yearSelect = document.getElementById('yearSelect');
    const togglePin = document.getElementById('togglePin');
    
    let currentDomain = '';
    let currentPassword = '';
    let isPinVisible = false;

    togglePin.addEventListener('click', function() {
        isPinVisible = !isPinVisible;
        pinInput.type = isPinVisible ? 'text' : 'password';
        togglePin.textContent = isPinVisible ? 'Hide PIN' : 'Show PIN';
    });
	
	
	function populateYearDropdown() {
		const currentYear = new Date().getFullYear();
		const startYear = currentYear - 49;
		const endYear = currentYear + 50;
		
		for (let year = startYear; year <= endYear; year++) {
			const option = document.createElement('option');
			option.value = year;
			option.textContent = year;
			yearSelect.appendChild(option);
		}
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

    function validateMilitaryPassword(password) {
        let hasUppercase = false;
        let hasLowercase = false;
        let hasNumber = false;
        let hasSpecial = false;
        let hasMilitary = false;

        for (let i = 0; i < password.length; i++) {
            const char = password[i];
            
            if (!hasUppercase && char >= 'A' && char <= 'Z') {
                hasUppercase = true;
            }
            
            if (!hasLowercase && char >= 'a' && char <= 'z') {
                hasLowercase = true;
            }
            
            if (!hasNumber && char >= '0' && char <= '9') {
                hasNumber = true;
            }
            
            if (!hasSpecial && char === '@') {
                hasSpecial = true;
            }
            
            if (!hasMilitary && char === '#') {
                hasMilitary = true;
            }
        }

        const checks = {
            length: password.length === 12,
            uppercase: hasUppercase,
            lowercase: hasLowercase,
            numbers: hasNumber,
            special: hasSpecial,
            military: hasMilitary
        };

        for (const [check, result] of Object.entries(checks)) {
            if (!result) {
                console.log(`Requirement failed: ${check}`);
                if (check === 'length') {
                    console.log(`Password length: ${password.length}`);
                } else if (check === 'uppercase') {
                    console.log('No uppercase character found');
                } else if (check === 'lowercase') {
                    console.log('No lowercase character found');
                } else if (check === 'numbers') {
                    console.log('No number found');
                } else if (check === 'special') {
                    console.log('No special character (@) found');
                } else if (check === 'military') {
                    console.log('No military character (#) found');
                }
            }
        }

        return Object.values(checks).every(check => check);
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

    function generateDeterministicPassword(domain, pin, month, year, nickname) {
        return generateMilitaryPassword(domain, pin, month, year, nickname);
    }

    function updateRequiredFieldsMessage() {
        const messages = [];
        const nickname = document.getElementById('nickname')?.value;
        const pin = document.getElementById('pinInput')?.value;
        const month = document.getElementById('monthSelect')?.value;
        const year = document.getElementById('yearSelect')?.value;
        
        if (!nickname) {
            messages.push('Enter Nick Name');
        }
        if (!pin) {
            messages.push('Enter PIN');
        }
        if (!month) {
            messages.push('Select Month');
        }
        if (!year) {
            messages.push('Select Year');
        }
        
        if (messages.length > 0) {
            passwordDisplay.innerHTML = messages.map(msg => 
                `<div style="color: #d93025; margin-bottom: 5px;">${msg}</div>`
            ).join('');
        } else {
            passwordDisplay.textContent = '';
        }
    }

    function sendPasswordToContentScript(password) {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			if (!tabs[0]) return;
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js']
            }).then(() => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updatePassword',
                    password: password
                }).catch(error => {
                    console.log('Content script not ready yet:', error);
                });
            }).catch(error => {
                console.log('Failed to inject content script:', error);
            });
        });
    }
	
    const PASSWORD_EXPIRY_DAYS = 30;
    function checkPasswordExpiration(setDate) {
        const setDateTime = new Date(setDate);
		const currentDate = new Date();
        const diffTime = currentDate - setDateTime;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const daysRemaining = PASSWORD_EXPIRY_DAYS - diffDays;
        
        return {
            expired: diffDays >= PASSWORD_EXPIRY_DAYS,
            daysRemaining: daysRemaining
        };
    }
	
	function deleteRecord(domain) {
		const rootDomain = domain.split('.').slice(-2).join('.');
		localStorage.removeItem(rootDomain);
		location.reload();
	}
	
	function updateRecordStatus(domain) {
		const rootDomain = domain.split('.').slice(-2).join('.');
		const recordJSON = localStorage.getItem(rootDomain);
		const deleteBtn = document.getElementById('deleteRecord');
		const passwordInfo = document.querySelector('.password-info');
		
		if (!recordJSON) {
			passwordInfo.style.display = 'none';
			return;
			}
		
		const record = JSON.parse(recordJSON);
		passwordInfo.style.display = 'block';
		
		const { expired, daysRemaining } = checkPasswordExpiration(record.setDate);
		
		if (expired) {
			document.getElementById('daysRemaining').textContent = 'Password expired!';
			document.getElementById('daysRemaining').classList.add('expired');
			deleteBtn.disabled = false;
		} else {
			document.getElementById('daysRemaining').textContent = `${daysRemaining} Days`;
			document.getElementById('daysRemaining').classList.remove('expired');
			deleteBtn.disabled = false;
		}
	}
	
	function updateActionButton(domain) {
		const rootDomain = domain.split('.').slice(-2).join('.');
		const actionButton = document.getElementById('actionButton');
		
		const recordJSON = localStorage.getItem(rootDomain);
		
		if (recordJSON) {
			const record = JSON.parse(recordJSON);
			const { expired, daysRemaining } = checkPasswordExpiration(record.setDate);
			
			if (expired && daysRemaining <= 0) {
				actionButton.textContent = 'Use It as Password';
				actionButton.onclick = function () {
					if (currentPassword && currentDomain) {
						localStorage.removeItem(rootDomain);

						const newRecord = {
							domain: rootDomain,
							setDate: new Date().toISOString()
						};
						
                    localStorage.setItem(rootDomain, JSON.stringify(newRecord));
                    updateRecordStatus(currentDomain);
                    sendPasswordToContentScript(currentPassword);
					location.reload();
					}
				};
			} else {
				actionButton.textContent = 'Auto Fill';
				actionButton.onclick = function () {
					if (currentPassword) {
						sendPasswordToContentScript(currentPassword);
					}
				};
			}
		} else {
			actionButton.textContent = 'Use This as Password';
			actionButton.onclick = function () {
				if (currentPassword && currentDomain) {
					const newRecord = {
						domain: rootDomain,
						setDate: new Date().toISOString()
						};
					localStorage.setItem(rootDomain, JSON.stringify(newRecord));
					sendPasswordToContentScript(currentPassword);
					location.reload();
				}
			};
		}
	}

    populateYearDropdown();
    updateRequiredFieldsMessage();

    document.getElementById('nickname').addEventListener('input', validateAndUpdatePassword);
    document.getElementById('monthSelect').addEventListener('change', validateAndUpdatePassword);
    document.getElementById('yearSelect').addEventListener('change', validateAndUpdatePassword);
    document.getElementById('pinInput').addEventListener('input', validateAndUpdatePassword);


    function validateAndUpdatePassword() {
        const nickname = document.getElementById('nickname').value;
        const pin = document.getElementById('pinInput').value;
        const month = document.getElementById('monthSelect').value;
        const year = document.getElementById('yearSelect').value;
        
        updateRequiredFieldsMessage();
        
        if (!nickname || !pin || !month || !year) {
            document.getElementById('actionButton').disabled = true;
            return;
        }
        
        if (pin.length !== 6 || !/^\d+$/.test(pin)) {
            passwordDisplay.textContent = 'PIN must be 6 digits';
            document.getElementById('actionButton').disabled = true;
            return;
        }
        
        try {
            currentPassword = generateMilitaryPassword(
                currentDomain,
                pin,
                parseInt(month),
                parseInt(year),
                nickname
            );
            passwordDisplay.textContent = currentPassword;
            document.getElementById('actionButton').disabled = false;
            updateRecordStatus(currentDomain);
            updateActionButton(currentDomain);
        } catch (error) {
            console.error('Password generation error:', error);
            passwordDisplay.textContent = 'Error generating password';
            document.getElementById('actionButton').disabled = true;
        }
    }

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url) {
            try {
                const url = new URL(tabs[0].url);
                currentDomain = url.hostname;
                domainElement.textContent = currentDomain;
                updateRecordStatus(currentDomain);
                updateActionButton(currentDomain);
            } catch (error) {
                console.error('Error parsing URL:', error);
                currentDomain = '';
                domainElement.textContent = 'Invalid URL';
            }
        } else {
            currentDomain = '';
            domainElement.textContent = 'No active tab';
        }
    });

    document.getElementById('deleteRecord').addEventListener('click', function() {
        if (currentDomain) {
            deleteRecord(currentDomain);
        }
    });
}); 