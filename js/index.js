(function(root, factory) {
    if (typeof exports == "object" && typeof module == "object") {
        exports = module.exports = factory(root)
    } else {
        if (typeof define == "function" && define.amd) {
            define("scene", [],
            function() {
                return factory(root)
            })
        } else {
            root.scene = factory(root)
        }
    }
})(this,
function(root) {
    var loc = location,
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    exports = {},
    DEFAULT = {
        history: true,
        reload: false,
        direct: true
    },
    _sceneMap = {},
    _preSceneId,
    _stash,
    $trick,
    supportHistory = "pushState" in history && "replaceState" in history;
    if (isMobile) {
        $trick = $("<div/>").appendTo("body");
        $trick.css({
            "width": "100%",
            "height": "100%",
            "position": "absolute",
            "left": 0,
            "top": 0,
            "z-index": 100000
        }).hide()
    }
    var gc = {
        show: function() {
            isMobile && $trick.show()
        },
        hide: function() {
            isMobile && setTimeout(function() {
                $trick.hide()
            },
            350)
        }
    };
    var Scene = function() {};
    var sce = Scene.prototype;
    sce.refresh = function() {
        Scene.render(this, true)
    };
    var sceneSelector = exports.sceneSelector = ".scene";
    exports.define = function(options) {
        var scene = _sceneMap[options.name];
        if (scene) {
            $.extend(true, scene, scene, options)
        } else {
            var $scene = $("#" + options.name + sceneSelector);
            options = $.extend(true, {
                title: $scene.data("title") || "",
                animation: $scene.data("animation") || exports.animation,
                history: $scene.data("history"),
                direct: $scene.data("direct")
            },
            DEFAULT, options);
            var anonymous = function() {};
            anonymous.prototype = new Scene();
            _sceneMap[options.name] = scene = new anonymous();
            $.extend(true, scene, scene, options)
        }
        return scene
    };
    exports.backUtil = function(sceneId, options) {
        _stash = {
            type: "backUtil",
            data: Array.prototype.slice.call(arguments, 0)
        };
        var regex = new RegExp("^#!" + sceneId),
        hash = location.hash;
        if (!regex.test(hash)) {
            history.back();
            return
        }
        options = options || {};
        options.replace = true;
        _stash = null;
        exports.go(sceneId, options);
        return
    };
    exports.go = function(sceneId, options) {
        if (!sceneId || _preSceneId == sceneId) {
            return
        }
        var instance = Scene.get(sceneId),
        reload = (options && options.reload) || instance.reload;
        if (instance.url && (!options || !options.ajax) && (!instance.isInited || reload)) {
            $.ajax({
                url: instance.url,
                beforeSend: instance.before,
                complete: instance.after,
                success: function(text) {
                    var $scene = $("#" + _preSceneId + sceneSelector);
                    var html = ['<div id="' + sceneId + '" class="scene scene-out">', (instance.render ? "": text), "</div>"];
                    $scene.after(html.join(""));
                    instance.tmpl = text;
                    exports.go(sceneId, {
                        ajax: true
                    })
                }
            });
            return
        }
        var $oldScene = $("#" + _preSceneId + sceneSelector),
        $newScene = $("#" + sceneId + sceneSelector),
        isBack = Scene.isBack(_preSceneId, sceneId);
        options = $.extend(true, {
            replace: !_preSceneId
        },
        instance, options);
        gc.show();
        if (_preSceneId) {
            var instance2 = Scene.get(_preSceneId);
            instance2.dismiss && instance2.dismiss();
            $oldScene[isBack ? "addClass": "removeClass"]("reverse").addClass(options.animation).removeClass("scene-in").addClass("scene-out");
            $newScene.addClass(options.animation)
        }
        supportHistory && options.history && history[options.replace ? "replaceState": "pushState"](null, document.title, "#!" + sceneId);
        if (Scene.render(instance) === false) {
            return
        }
        $newScene[isBack ? "addClass": "removeClass"]("reverse").removeClass("scene-out").addClass("scene-in");
        _preSceneId = sceneId;
        gc.hide();
        if (isMobile) {
            var $temp = $("<div style='visibility:hidden;'/>").appendTo("body");
            setTimeout(function() {
                $temp.remove()
            },
            600)
        }
    };
    exports.reload = function(sceneId) {
        Scene.get(sceneId).refresh()
    };
    exports.animation = "";
    exports.init = function() {
        var hash = loc.hash,
        sceneId, options = {
            history: true
        };
        if (/^#!/.test(hash)) {
            sceneId = hash.replace(/^#!/, "")
        } else {
            if (hash == "" || hash == "#") {
                var $scene = $(".scene-in" + sceneSelector);
                $scene = $scene.length > 0 ? $scene: $(sceneSelector);
                sceneId = $scene.eq(0).attr("id")
            }
        }
        if (sceneId) {
            var instance = Scene.get(sceneId);
            if (instance.direct === false || typeof(instance.direct) == "string") {
                if (typeof(instance.direct) == "string") {
                    exports.go(instance.direct, options)
                }
                return
            }
            exports.go(sceneId, options)
        }
    };
    Scene.get = function(name) {
        var instance = _sceneMap[name];
        if (!instance) {
            exports.define({
                name: name
            });
            instance = _sceneMap[name]
        }
        return instance
    };
    Scene.init = function(scene) {
        if (scene.isInited) {
            return
        }
        var $mod = $("#" + scene.name + sceneSelector);
        $.each(["swipe", "swipeLeft", "swipeRight", "swipeUp", "swipeDown", "doubleTap", "tap", "singleTap", "longTap"],
        function(index, item) {
            scene[item] && $mod.on(item,
            function(e) {
                exports.go(scene[item]);
                e.preventDefault()
            })
        });
        scene.events && $.each(scene.events,
        function(key) {
            var keys = key.split(/\s+/),
            eventType = keys.shift(),
            callback = scene.events[key];
            $mod.delegate(keys.join(" "), eventType,
            function() {
                gc.show(); (typeof(callback) == "function" ? callback: scene[callback]).apply(this, arguments);
                gc.hide()
            })
        });
        scene.init && scene.init.call(scene);
        scene.isInited = true
    };
    Scene.render = function(scene, reload) {
        var thix = scene,
        render = thix.render;
        reload = reload || thix.reload || !thix.isInited;
        var $mod = $("#" + thix.name + sceneSelector),
        html = thix.tmpl;
        if (reload && !html && !thix.isInited) {
            html = thix.tmpl = $mod.html()
        }
        if (render) {
            html = render.call(thix, html);
            $mod.empty().html(html)
        }
        reload && Scene.init(thix);
        thix.title && (document.title = thix.title);
        if (thix.enter) {
            return thix.enter()
        }
    };
    Scene.isBack = function(source, target) {
        var $scene = $(sceneSelector),
        $source = $("#" + source + sceneSelector),
        $target = $("#" + target + sceneSelector);
        return $scene.index($source) > $scene.index($target)
    };
    $("body").delegate("a", "click",
    function(e) {
        var $this = $(this),
        href = $this.attr("href"),
        rel = $this.data("rel");
        if (rel == "external") {
            return
        }
        if (rel == "back") {
            history.go( - 1);
            e.preventDefault();
            return
        } else {
            if (/^#\w/i.test(href)) {
                href = href.replace(/^#/, "");
                exports.go(href);
                e.preventDefault()
            } else {
                if (!href || /^javascript/.test(href)) {
                    return
                }
            }
        }
    });
    $(document).ready(exports.init);
    $(window).on("popstate",
    function(e) {
        var hash = loc.hash;
        if (!/^#!/.test(hash)) {
            return
        }
        if (_stash && _stash.type == "backUtil") {
            exports.backUtil.apply(window, _stash.data);
            return
        }
        exports.go(hash.replace(/^#!/, ""), {
            history: false
        })
    });
    return exports
}); (function() {
    function getQueryString(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        return r ? unescape(r[2]) : null
    }
    var __rl_npid = window.__rl_npid = "laowaikandongxi";
    var _rl = document.createElement("script");
    _rl.type = "text/javascript";
    _rl.async = true;
    _rl.src = "http://shared.ydstatic.com/sw/rlog20140527.js";
    var __rl_post = window.__rl_post = [];
    __rl_post.push(["keyfrom", getQueryString("keyfrom")]);
    __rl_post.push(["platform", getQueryString("platform")]);
    __rl_post.push(["title", encodeURIComponent(document.title)]);
    var s = document.getElementsByTagName("head")[0];
    s.appendChild(_rl)
})(); (function() {
    var num;
    $.ajax({
        type: "GET",
        url: "http://nc008x.corp.youdao.com:28085/course/cardtea/fetchNum.json",
        dataType: "jsonp",
        success: function(data) {
            cardtea.num = data.result
        }
    });
    scene.define({
        name: "page1",
        animation: "slide",
        dismiss: function() {
            var video = document.getElementsByTagName("video")[0];
            if (video) {
                video.pause()
            }
        }
    });
    scene.define({
        name: "page2",
        animation: "slide",
        url: "question.html",
        direct: "page1",
        render: function(tmpl) {
            var data = {
                question: cardtea.question,
                options: cardtea.options,
                rightOption: cardtea.rightOption
            };
            var $tmpl = doT.template(tmpl);
            doT.templateSettings.strip = false;
            return $tmpl(data)
        }
    });
    scene.define({
        name: "page3",
        animation: "slide",
        url: "guaka.html?v=20150326",
        direct: "page1",
        render: function(tmpl) {
            var $tmpl = doT.template(tmpl);
            doT.templateSettings.strip = false;
            return $tmpl({
                number: cardtea.num,
                lesson: cardtea.id,
                ruleText: cardtea.ruleText,
                awardsImg: cardtea.awardsImg,
                submitTips: cardtea.submitTips
            })
        },
    });
    scene.define({
        name: "page4",
        animation: "slide",
        url: "address.html",
        direct: "page1",
        render: function(tmpl) {
            var $tmpl = doT.template(tmpl);
            doT.templateSettings.strip = false;
            return $tmpl({
                lesson: cardtea.id,
                submitTips: cardtea.submitTips
            })
        }
    })
} ()); (function() {
    var node = $(".subtitle  .subtitleText").eq(0);
    var text = node.html();
    var partText = text.substr(0, 80) + "……";
    node.html(partText);
    $(".subtitle .more").on("click",
    function() {
        var moreStr = $(".subtitle .more").html();
        if (moreStr == "全部") {
            node.html(text);
            $(".subtitle .more").html("收起")
        } else {
            node.html(partText);
            $(".subtitle .more").html("全部")
        }
    })
} ());
$(document).ready(function() {
    $(".words-ul li").width($(".words-slide").width());
    function getWords() {
        $.ajax({
            type: "get",
            url: "json/tea_words.json",
            dataType: "json",
            success: function(data) {
                setCalendar(data)
            },
            error: function() {
                alert("error")
            }
        })
    }
    getWords();
    function setCalendar(data) {
        var len = data.words.length;
        for (var i = 0; i < len; i++) {
            var obj = data.words[i];
            $(".words-ul").append("<li><i>" + obj.episode + "</i><p>" + obj.date + "</p><h2>" + obj.word + "</h2><p>【基本释义】：" + obj.definition + '</p><a class="words-click" href="' + obj.url + '"></a></li>')
        }
        var liwidth = $(".words-slide").width();
        $(".words-ul li").css("width", liwidth);
        calendarEvent()
    }
    function calendarEvent() {
        var idx=cardtea.id-1;
        var marginL = $(".words-slide").width();
        var left = -idx * marginL + "px";
        $(".words-ul").css("margin-left", left);
        function Slide(config) {
            this.client = config.client;
            this.wraper = config.wraper;
            this.items = config.items;
            this.slideSize = config.slideSize;
            this.curItem = config.curItem
        }
        Slide.prototype = {
            initial: function() {
                this.addEvent()
            },
            addEvent: function() {
                var that = this;
                var prev = $(".btn-left");
                var next = $(".btn-right");
                prev.on("click",
                function() {
                    that.prev()
                });
                next.on("click",
                function() {
                    that.next()
                })
            },
            jump: function(from, to) {
                if(to==-1||to==this.items.length){ 
            		return 0;
            	}
            	else{

                var leftOffset, range, curOffset, dest;
                from = parseInt(from);
                range = this.items.length;
                from = (from + range) % range;
                to = parseInt(to);
                to = (to + range) % range;
                leftOffset = (to - from) * this.items[0].offsetWidth;
                curOffset = -this.curItem * this.items[0].offsetWidth;
                dest = curOffset - leftOffset;
                this.wraper.css({
                    marginLeft: dest + "px"
                });
                this.curItem = to
                }
            },
            next: function() {
                this.jump(this.curItem, this.curItem + this.slideSize)
            },
            prev: function() {
                this.jump(this.curItem, this.curItem - this.slideSize)
            }
        };
        var config = {
            client: $(".words-slide"),
            wraper: $(".words-ul"),
            items: $(".words-ul").children("li"),
            slideSize: 1,
            curItem: idx
        };
        function init() {
            var mainSlide = new Slide(config);
            mainSlide.initial()
        }
        init()
    }
});
wx.config({
    debug: true,
    appId: _wx_auth.appId,
    timestamp: _wx_auth.timestamp,
    nonceStr: _wx_auth.nonceStr,
    signature: _wx_auth.signature,
    jsApiList: ["checkJsApi", "onMenuShareTimeline", "onMenuShareAppMessage", "onMenuShareQQ", "onMenuShareWeibo"]
});
wx.ready(function() {
    wx.onMenuShareTimeline(shareData);
    wx.onMenuShareAppMessage(shareData);
    wx.onMenuShareQQ(shareData);
    wx.onMenuShareWeibo(shareData)
});
$(document).ready(function() {
    console.log(yd);
    if (yd.account.isLogin()) {
        $(".nav .f-answer").attr("href", "#page2")
    } else {
        $(".nav .f-answer").on("click",
        function() {
            var sid = location.href.search("#");
            var url = location.href.slice(0, sid);
            yd.account.login(url)
        })
    }
    var ypos = $(".xue-logo").offset().top + 100;
    $(".comments-btn").on("click",
    function() {
        $("#page1").scrollTop(ypos)
    })
}); (function(root) {
    var ec = encodeURIComponent;
    var tmplString = $("#tmpl").text();
    var isIOSYoudao = function() {
        return window.navigator.userAgent.indexOf("YDShare") !== -1 && window.navigator.userAgent.indexOf("iphone") !== -1
    };
    var isAndroidYoudao = function() {
        return window.dict !== undefined && window.dict.share !== undefined
    };
    var isWeixin = function() {
        var ua = navigator.userAgent.toLowerCase();
        return ua.match(/MicroMessenger/i) == "micromessenger"
    };
    var isYixin = function() {
        return navigator.userAgent.toLowerCase().indexOf("yixin") !== -1
    };
    var types = {
        sina: function(data) {
            var params = ["appkey=", data.appKey, "&title=", ec(data.title || document.title), "&content=", data.charset || "gb2312", "ralateUid=", data.uid, "&pic=", ec(data.imgUrl || ""), "&c=srp_h_youdao_cidian_fs00_null"];
            return "http://v.t.sina.com.cn/share/share.php?" + params.join("")
        },
        qq: function(data) {
            var params = ["url=", ec(data.location || document.location), "&title=", ec(document.title), "&desc=", ec(data.title), "&pics=", ec(data.imgUrl || "")];
            return "http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?" + params.join("")
        },
        yixin: function(data) {
            var params = ["appkey=", "", "&url=", ec(data.location || document.location), "&title=", ec(document.title), "&type=", "webpage", "&pic=", ec(data.imgUrl || ""), "&userdesc=", ec(""), "&desc=", ec(data.title)];
            return "http://open.yixin.im/share?" + params.join("")
        }
    };
    var titles = {
        sina: "分享到新浪微博",
        qq: "分享到QQ空间",
        yixin: "分享到易信"
    };
    var open = function(type, data) {
        if (isAndroidYoudao() && type !== "qq") {
            window.dict.share(type, data.imgUrl, data.location, data.title, data.wtitle)
        } else {
            window.open(types[type](data), titles[type], ["toolbar=0,status=0,resizable=1,width=" + data.width + ",height=" + data.height + ",left=", (screen.width - data.width) / 2, ",top=", (screen.height - data.height) / 2].join(""))
        }
    };
    var shareOne = function(type, data) {
        open(type, {
            wtitle: data.wtitle + data.url,
            title: data.title + data.url,
            appKey: "",
            uid: "",
            imgUrl: data.img || "",
            location: data.url,
            charset: "utf-8",
            width: 620,
            height: 600
        })
    };
    var weixinData;
    var setWeixinData = function(data) {
        return weixinData = {
            img_url: data.img,
            img_width: "640",
            img_height: "640",
            link: data.url,
            desc: data.title,
            title: data.wtitle
        }
    };
    if (isWeixin()) {
        $(document).on("WeixinJSBridgeReady",
        function() {
            WeixinJSBridge.on("menu:share:appmessage",
            function(argv) {
                WeixinJSBridge.invoke("sendAppMessage", weixinData,
                function(res) {})
            });
            WeixinJSBridge.on("menu:share:weibo",
            function(argv) {
                WeixinJSBridge.invoke("shareWeibo", shareData,
                function(res) {})
            });
            WeixinJSBridge.on("menu:share:timeline",
            function(argv) {
                WeixinJSBridge.invoke("shareTimeline", shareData,
                function(res) {})
            })
        })
    }
    var iosDictShare = function(data, callback) {
        window.open("yddict://share?title=" + data.wtitle + "&&content=" + data.title + "&&topic=" + data.topic + "&&image=" + data.img + "&&url=" + data.url);
        if ($.isFunction(callback)) {
            callback()
        }
    };
    var androidDictShare = function(type, data) {
        window.dict.share(type, data.imgUrl, data.url, data.title, data.wtitle)
    };
    var share = {};
    var checkWhatToShow = function() {
        return {
            weixin: isWeixin() || isAndroidYoudao(),
            weibo: true,
            yixin: true,
            dict: isAndroidYoudao()
        }
    };
    var sliceInAndorid = function(str) {
        var pos = str.indexOf("#");
        if (pos === -1) {
            return str
        }
        return str.slice(0, pos)
    };
    var tmpShareData = {
        title: "分享",
        wtitle: "分享标题",
        img: "",
        url: sliceInAndorid(location.href),
        date: (new Date).getDate(),
        topic: "有道词典"
    };
    $.extend(share, {
        $el: $("#sharePanel"),
        tmpl: tmplString,
        data: tmpShareData,
        setShareData: function(shareData) {
            var data = $.extend(tmpShareData, shareData);
            if (isWeixin()) {
                return setWeixinData(data)
            }
            this.data = data
        },
        bindEvents: function() {
            var self = this;
            this.$el.find(".share").on("click",
            function(e) {
                if (e.target.id === "weixin" && isWeixin()) {
                    $("#weixinTip").show()
                } else {
                    shareOne($(e.target).data("type"), self.data)
                }
                if ($.isFunction(self.callback)) {
                    self.callback()
                }
            });
            $("#cancel").on("click",
            function() {
                self.hide()
            });
            $("#close").on("touchend",
            function() {
                self.hide()
            })
        },
        init: function() {
            var self = this;
            var conf = checkWhatToShow();
            this.$el = $("#sharePanel");
            if (this.$el.length === 0) {
                this.$el = $(doT.template(self.tmpl)(conf));
                this.$el.appendTo("body").hide()
            }
            this.bindEvents()
        },
        show: function(data, callback) {
            var self = this;
            if ($.isFunction(callback)) {
                self.callback = callback
            }
            if (self.$el.length === 0) {
                self.init()
            }
            this.setShareData(data);
            if (isIOSYoudao()) {
                iosDictShare(self.data, self.callback);
                return
            }
            this.$el.show();
          
        },
        hide: function() {
            this.$el.hide()
        }
    });
    $.extend(share, {
        isYixin: isYixin
    });
    root.yd.share = share
})(window); (function(root) {
    var videoPlayClickHandler = function(self) {
        if (self.find("video").length > 0) {
            return
        }
        var videoString = self.find("script").html();
        self.html(videoString);
        var eVideo = self.find("video");
        var video = eVideo[0];
        window.setTimeout(function() {
            video && video.play()
        },
        1000);
        var src = video && $(video).attr("src");
        if (!src) {
            src = video && $(video).find("source").attr("src")
        }
        __rl_event && __rl_event("video.firstplay");
        eVideo.on("play", _videojsEventHandler).on("pause", _videojsEventHandler).on("ended", _videojsEventHandler)
    };
    var videoPlaySelector = "div.video-play-btn";
    $(document).on("click", videoPlaySelector,
    function(evt) {
        videoPlayClickHandler($(this))
    });
    function _videojsEventHandler(evt) {
        __rl_event && __rl_event("video." + evt.type)
    }
    function _videojsEventHandler(evt) {
        __rl_event && __rl_event("video." + evt.type)
    }
    if (navigator.userAgent.toLowerCase().indexOf("mobile") === -1) {
        videojs("example_video_1").on("firstplay", _videojsEventHandler).on("play", _videojsEventHandler).on("pause", _videojsEventHandler).on("ended", _videojsEventHandler)
    }
    $("#checkMore").on("click",
    function(e) {
        if ($(e.target).hasClass("check-more")) {
            $("#history a").show();
            $(e.target).removeClass("check-more");
            $(e.target).text("收起")
        } else {
            $("#history a").each(function(inx, a) {
                if (inx > 2) {
                    $(a).hide()
                }
            });
            $(e.target).addClass("check-more");
            $(e.target).text("查看更多")
        }
    });
    $("body").delegate(".share", "click",
    function(e) {
        yd.share.show(shareData)
    })
})(window);