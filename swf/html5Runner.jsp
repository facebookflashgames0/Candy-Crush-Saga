










<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <script src="/js/jquery-1.4.3.min.js" type="text/javascript"></script>
</head>

<body align="center">
<div id="gameContainer"></div>


<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<link rel="shortcut icon" href="assets/favicon.ico">
<link rel="apple-touch-icon" href="assets/favicon-32x32.png">
<link rel="icon" href="assets/favicon-32x32.png" type="image/png">

<!-- TRACKING SNIPPET -->
<script type="text/javascript">
    var trackLoadingStep = (function (tracking) {
        return function (loadingStep) {
            var protocol = tracking.rpc.secure ? "https://" : "//";
            var isHttps = tracking.rpc.secure || "https:" == document.location.protocol;
            var port = isHttps ? tracking.rpc.securePort : tracking.rpc.port;
            var url = protocol + tracking.rpc.host + ":" + port + "/" + tracking.rpc.page;
            if (tracking.rpc.session_id) url += "?_session=" + tracking.rpc.session_id;
            var mFunnelId = window.TrackingFunnelId || (window.TrackingFunnelId = String(Date.now()));
            var http = new XMLHttpRequest();
            http.open("POST", url, true);
            http.timeout = 15 * 1000;
            http.ontimeout = http.onabort = http.onerror = function (error) {
                var watcher = setInterval(function () {
                    var checkpoint = null;
                    try { checkpoint = king.ff.Engine.trackCheckpoint; }
                    catch (e) { checkpoint = null; }

                    if (typeof(checkpoint) === 'function') {
                        checkpoint(loadingStep);
                        clearInterval(watcher);
                    }
                }, 1000);
            };
            http.onload = function () {
                if (http.status === 200 || http.status === 304 || http.status === 206 || (http.status === 0 && http.response)) {
                } else {
                    http.onerror(null);
                }
            };
            http.send(JSON.stringify([{ jsonrpc: "2.0", method: "TrackingApi.track", id: 0, params: [tracking.sign_in_source, 0, "", { type: 7501, parameters: [tracking.core_user_id, mFunnelId, loadingStep, Date.now()] }] }]));
        };
    })({ // settings
        rpc: {
            host: "candycrush.king.com",
            page: "rpc/ClientApi",
            session_id: "",
            securePort: 443,
            port: 80,
            secure: true
        },
        sign_in_source: 1, // required
        core_user_id : 999 // required
    });

    trackLoadingStep("HTMLTopOfHead");
</script>

<style>
    /* RESETS */
    html,body,div,canvas { margin: 0; padding: 0; }
</style>

<script src="/js/jLog.min.js" type="text/javascript"></script>
<script src="/plataforma/js/jsonrpc-jquery.js" type="text/javascript"></script>
<script src="/plataforma/pack/king-facebook.js" type="text/javascript"></script>
<script type="text/javascript">
    var canvasHeight, canvasWidth;
    var superSamplingRatio = 1.2;
    function calculateCanvasSize(){
        var availableWidth = window.innerWidth;

        //Fixed size for the moment
        canvasHeight = 640; //Math.min(640, availableWidth / 16 * 10);
        canvasWidth = 755; //canvasHeight / 10 * 16;
    }

    function resizeCanvas() {
        calculateCanvasSize();
        if((typeof Module != "undefined") && (typeof Module.canvas != "undefined"))
        {
            var canvas = Module.canvas;
            canvas.width = canvasWidth * superSamplingRatio;
            canvas.height = canvasHeight * superSamplingRatio;
            canvas.style.width = canvasWidth + "px";
            canvas.style.height = canvasHeight + "px";
        }
        View.SetViewSize(canvasWidth, canvasHeight);
    }

    $(window).resize( function () {
        resizeCanvas();
    });

    html5ClientVariables = {};
    html5ClientVariables.CURRENT_LEVEL = "";
    html5ClientVariables.IS_KINGDOM_ENABLED = true;

    window.jsonCurrentLevel= function(gameConf) {
        html5ClientVariables.CURRENT_LEVEL = gameConf;
    }

</script>

<link media="all" type="text/css" href="/css/client-view.css" rel="stylesheet" />
<script type="text/javascript"> trackLoadingStep("HTMLBottomOfHead");</script>

<style>
    .image-error::after { content: url('/images/client_assets/yeti.png'); }
    a.firefox { background-image: url('https://candycrush-prod.akamaized.net/client/assets/firefox.png?_v=1p9lw6y'); }
    a.chrome { background-image: url('https://candycrush-prod.akamaized.net/client/assets/chrome.png?_v=1531fru'); }
    a.opera { background-image: url('https://candycrush-prod.akamaized.net/client/assets/opera.png?_v=bug7fk'); }
    a.edge { background-image: url('https://candycrush-prod.akamaized.net/client/assets/edge.png?_v=fqrpxr'); }
    a.store-amazon { background-image: url('https://candycrush-prod.akamaized.net/client/assets/store-amazon.png?_v=lp6vc'); }
    a.store-microsoft { background-image: url('https://candycrush-prod.akamaized.net/client/assets/store-microsoft.png?_v=tgtwhn'); }
    a.store-google { background-image: url('https://candycrush-prod.akamaized.net/client/assets/store-google.png?_v=1cln5sm'); }
    a.store-apple { background-image: url('https://candycrush-prod.akamaized.net/client/assets/store-apple.png?_v=c7uyv3'); }
</style>



<div id="view" class="view-outer">
    <div id="view-game" class="view-inner"></div>

    <div id="view-background" class="view-inner">
        <img src="https://candycrush-prod.akamaized.net/client//assets/background.png?_v=5okixp" onload="this.style.opacity='1';" class="fadein"/>
    </div>
    <div id="view-preloader" class="view-inner" style="display:none;">
        <img id="prelaoder-logo" src="https://candycrush-prod.akamaized.net/client//assets/logo.png?_v=txc157" onload="this.style.opacity='1';" class="fadein"/>
        <div id="prelaoder-status" class="status-text">Downloading...</div>
        <div id="prelaoder-progress"><div></div></div>
    </div>
    <div id="view-mobile" class="view-inner" style="display:none;">
        <div class="image-error"></div>

        <div id="store-other" style="display:none;">
            <div id="view-mobile-text" class="status-text">Uh-oh, we do not support your phone.<br />Please use a desktop browser.</div>
        </div>
        <div id="store-wp" style="display:none;">
            <div id="view-mobile-text" class="status-text">Uh-oh, we don't support this browser.<br />Please download the game from Windows Store or play it on a desktop browser!</div>
        </div>
        <div id="store-ios" style="display:none;">
            <div id="view-mobile-text" class="status-text">Uh-oh, we don't support this browser.<br />Please download the game from App Store or play it on a desktop browser!</div>
        </div>
        <div id="store-android" style="display:none;">
            <div id="view-mobile-text" class="status-text">Uh-oh, we don't support this browser.<br />Please download the game from Google Play or play it on a desktop browser!</div>
        </div>

        <div class="list-stores">
            <div><a class="unselectable store-amazon" href="https://www.amazon.com/gp/product/B00FAPF5U0" target="_blank"></a></div>
            <div><a class="unselectable store-google" href="https://play.google.com/store/apps/details?id=com.king.candycrushsaga" target="_blank"></a></div>
            <div><a class="unselectable store-apple" href="https://itunes.apple.com/us/app/candy-crush-saga/id553834731?ls=1&mt=8" target="_blank"></a></div>
            <div><a class="unselectable store-microsoft" href="https://www.microsoft.com/store/p/candy-crush-saga/9nblggh18846" target="_blank"></a></div>
        </div>
    </div>
    <div id="view-incompatibility" class="view-inner" style="display:none;">
        <div class="image-error"></div>
        <div class="status-text">Uh-oh, we do not support your browser.<br />Please use another browser.</div>
        <table class="alternatives">
            <tbody>
            <tr>
                <td>
                    <a class="unselectable browser-tile firefox" href="https://www.mozilla.org/firefox/new/" target="_blank">
                        <span class="text-browser">Firefox</span>
                        <span class="text-vendor">Mozilla Foundation</span>
                    </a>
                </td>
                <td>
                    <a class="unselectable browser-tile chrome" href="https://www.google.com/chrome/browser/desktop/" target="_blank">
                        <span class="text-browser">Chrome</span>
                        <span class="text-vendor">Google</span>
                    </a>
                </td>
                <td>
                    <a class="unselectable browser-tile edge" href="https://www.microsoft.com/windows/microsoft-edge" target="_blank">
                        <span class="text-browser">Edge (Windows 10)</span>
                        <span class="text-vendor">Microsoft</span>
                    </a>
                </td>
                <td>
                    <a class="unselectable browser-tile opera" href="http://www.opera.com/" target="_blank">
                        <span class="text-browser">Opera</span>
                        <span class="text-vendor">Opera Software</span>
                    </a>
                </td>
            </tr>
            </tbody>
        </table>
    </div>

    <div id="view-no-webgl" class="view-inner" style="display:none;">
        <div class="image-error"></div>
        <div class="status-text">We cannot run WebGL, please go to <a href="http://get.webgl.org/">WebGL</a> to check that you have the proper drivers installed for your graphic card and to get further instructions.</div>
    </div>

    <div id="view-fatal" class="view-inner" style="display:none;">
        <div class="image-error"></div>
        <div class="status-text">An error has occured. We are doing our best to fix it, please try in a moment.</div>
    </div>

    <div id="view-memory-error" class="view-inner" style="display:none;">
        <div class="image-error"></div>
        <div class="status-text">Uh-oh, we do not support your browser.<br />Please install the 64 bit version of your browser.</div>
    </div>
</div>

<script type="text/javascript" crossorigin="anonymous" src="https://candycrush-prod.akamaized.net/client/ff.js?_v=1ffwqd2"></script>
<script type="text/javascript" crossorigin="anonymous" src="/js/client-view.js" onerror="king.ff.onTagError(this);"></script>
<script type="text/javascript">
    resizeCanvas();
    var jsking = jsking || {};
    jsking.facebook = {
        appId: '210831918949520',
        appUrl: 'http://apps.facebook.com/candycrush/',
        accessToken: '',
        useFloating: true,
        canvasSize: {width: canvasWidth, height: canvasHeight}
    };

    jsking.init = {
        gameId: 'candycrushsaga',
        userId: '999',
        sessionKey: '',
        cdn: 'candycrush.king.com',
        locale: 'en',
        remoteRpcServiceUrl: "/rpc/ClientApi",
        network:"facebook",
    };

    king.ff.init({
        appJs: "https://candycrush-prod.akamaized.net/client/candycrushsaga.js?_v=1nuiuu0",
        appAsmJs: "https://candycrush-prod.akamaized.net/client/asm.js?_v=kkj9us",
        appParentId: "view-game",
        width: canvasWidth,
        height: canvasHeight,
        memFile: "https://candycrush-prod.akamaized.net/client/candycrushsaga.js.mem?_v=efcm76", // if empty then default
        
        dataFile: "https://candycrush-prod.akamaized.net/client/assets.data?_v=16ajnb1", // if empty then default
        
        dataMetaFile: "https://candycrush-prod.akamaized.net/client/assets.metadata?_v=18639hs",
        viewController: View,
        appVersion: "1",
        appLocale: "en",
        browserErrorAsEvent: true,
        memoryFragmentationAsEvent: true,
        userId: "999",
        gameId: "candycrushsaga",
        runtime : {
            gzipPostEnabled : true, // explicitly enable gzip for POST data.
            gzipPostThresholdBytes : 1 * 1024, // (Default: 64 * 1024) Only POST request where data size is bigger than given value is gzip'ped.
        },
        crashWriter: {
            rpc: {
                host: "candycrush.king.com", //Please use gateway
                page: "rpc/ClientApi",
                port: 80,
                securePort: 443,
                session_id: ""
            },
            install_id : "Emscripten-Facebook",
            sign_in_source: 1,
            core_user_id : 999
        },
        tracking: {
            rpc: {
                host: "candycrush.king.com", //Please use gateway
                page: "rpc/ClientApi",
                port: 80,
                securePort: 443,
                session_id: ""
            },
            sign_in_source: 1,
            core_user_id : 999
        },
        preallocateHeapSize: 96 * 1024 * 1024,
        customBlacklist: [{ max:"", reg: /version\/([\w\.]+) safari/i }]
    });
    if(Module && Module.appStarted) {
        Module.appStarted.push(function () {
            resizeCanvas();
        });
    }
</script>

<script type="text/javascript">
    var rpcData = {};
    rpcData.server = {
        host: "candycrush.king.com",
        port: 443,
        secure: true,
        supportsSsl: true
    };
    rpcData.servicelayer = {
        host: "servicelayer.king.com",
        port: 443,
        secure: true,
        supportsSsl: true
    };
</script>


</body>