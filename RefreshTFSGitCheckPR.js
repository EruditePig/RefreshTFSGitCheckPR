// ==UserScript==
// @name         定时刷新检测PR
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  定时刷新检测PR
// @author       EruditePig
// @match        http://172.22.222.151:8080/tfs/DefaultCollection/%E7%BB%93%E6%9E%84%E4%BA%A7%E5%93%81%E8%AE%BE%E8%AE%A1%E6%96%87%E6%A1%A3/_git/SPP/pullrequests?_a=active
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(

    function() {
    'use strict';
    var timer;
    var timer_interval = 5*60*1000; //ms
    var store_key = "sjxValue2";
    var wait_time = 10*1000; // ms

    setTimeout(function() {

        function reloadPage()
        {
            window.location.reload();
        }

        function setValue(value)
        {
            //JSON.stringify(value);
            GM_setValue(store_key, value);
        }

        function getValue()
        {
            return GM_getValue(store_key,"");
            //if (str_value == "") return {};
            //return JSON.parse(str_value);
        }

        function fetchValue()
        {
            var lists = document.getElementsByClassName("ms-List-cell");
            console.log(lists.length);
            var value = {};
            for (var i = 0; i < lists.length; i++)
            {
                var ariaLabel = lists[i].children[0].ariaLabel;
                var regexresult = /Pull request ([0-9]+) .*created by (.*)/.exec(ariaLabel);
                var time = lists[i].firstChild.firstChild.children[1].firstChild.children[2].firstChild.title;
                value[regexresult[1]] = {"author" : regexresult[2], "time" : time };
                console.log(regexresult[1], regexresult[2], time);
            }
            return value;
        }

        function notifyChange(content)
        {
            GM_notification ( {title: content.title,
                               text: content.text,
                               onclick: function() {
                                   var value_now = fetchValue();
                                   console.log(value_now);
                                   setValue(value_now);
                               }
                              } );
        }

        function checkIfModify()
        {
            var value_now = fetchValue();
            var value_before = getValue();
            // 新增了哪些
            var text = "";
            {
                var add_text = "新增了:";
                for(var key in value_now)
                {
                    if(!(key in value_before))
                    {
                        add_text += key.toString() + value_now[key]["author"] + ";";
                    }
                }
                if(add_text != "新增了:")
                {
                    text += add_text;
                }
            }

            {
                var del_text = "关闭了:";
                for(var key2 in value_before)
                {
                    if(!(key2 in value_now))
                    {
                        del_text += key2.toString() + value_before[key2]["author"] + ";";
                    }
                }
                if(del_text != "关闭了:")
                {
                    if(text != "")
                    {
                        text += "\n";
                    }
                    text += del_text;
                }
            }

            {
                var update_text = "更新了:";
                for(var key3 in value_before)
                {
                    if(key3 in value_now)
                    {
                        if(value_now[key3]["time"] != value_before[key3]["time"])
                        {
                            update_text += key3.toString() + value_before[key3]["author"] + ";";
                        }
                    }
                }
                if(update_text != "更新了:")
                {
                    if(text != "")
                    {
                        text += "\n";
                    }
                    text += update_text;
                }
            }

            if(text != "")
            {
                notifyChange({"tilte":"PR变化了", "text":text});
            }
        }

        function setTimer()
        {
            checkIfModify();
            timer = setInterval(reloadPage, timer_interval);
        }

        function stopTimer()
        {
            clearInterval(timer);
        }

        function save()
        {
            var value_now = fetchValue();
            setValue(value_now);
        }

        setTimer();
        GM_registerMenuCommand("stopTimer", stopTimer, "h");
        GM_registerMenuCommand("save", save, "h");
    }, wait_time);

})();
