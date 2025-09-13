// ==UserScript==
// @name         妖火论坛快捷回复插件
// @namespace    https://*.yaohuo.me
// @version      1.1
// @description  在妖火论坛帖子页面右侧添加快捷回复按钮，优化空白区域点击最小化
// @author       GodPoplar
// @match        https://www.yaohuo.me/bbs-*
// @grant        none
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    // 首先定义快捷回复的内容
    const replies = ['感谢分享', '感谢','多谢分享','多谢!', '666','已阅','同问','一样','等等','带带','帮顶','不至于','不清楚','不知道','O(∩_∩)O哈哈~','交给楼上','对','吃','没了','ε=(´ο｀*)))唉'];

    // 然后是配置数据结构
    const defaultSettings = {
        requireConfirm: false,
        customReplies: replies.slice(),
    };

    // 获取保存的设置或使用默认设置
    let settings = JSON.parse(localStorage.getItem('yaohuo_reply_settings')) || defaultSettings;
    settings = {
        ...defaultSettings,
        ...settings,
        customReplies: settings?.customReplies || defaultSettings.customReplies
    };

    // 创建设置面板函数
    function setMenu() {
        if (document.getElementById('yaohuo-modal-mask')) {
            return;
        }

        const style = `
            #yaohuo-modal-mask{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:10000;display:flex;align-items:center;justify-content:center}
            .yaohuo-wrap{background:white;border-radius:8px;min-width:300px;max-width:90%;max-height:80vh;overflow-y:auto}
            .yaohuo-wrap header{padding:15px;font-size:16px;font-weight:bold;border-bottom:1px solid #eee;text-align:center}
            .yaohuo-wrap .content{padding:15px}
            .yaohuo-wrap .reply-management{margin-top:15px}
            .yaohuo-wrap .reply-list{border:1px solid #eee;padding:10px;margin:10px 0;border-radius:4px}
            .yaohuo-wrap .reply-item{margin-bottom:8px}
            .yaohuo-wrap .reply-item input{padding:5px;border:1px solid #ddd;border-radius:4px}
            .yaohuo-wrap .reply-item button{padding:5px 10px;background:#ff4444;color:white;border:none;border-radius:4px;cursor:pointer}
            .yaohuo-wrap #add-reply{background:#4CAF50;color:white;border:none;padding:8px 15px;border-radius:4px;cursor:pointer}
            .yaohuo-wrap footer{padding:15px;text-align:center;border-top:1px solid #eee}
            .switch{position:relative;display:inline-block;width:50px;height:24px}
            .switch input{opacity:0;width:0;height:0}
            .slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:#ccc;transition:.4s;border-radius:24px}
            .slider:before{position:absolute;content:"";height:16px;width:16px;left:4px;bottom:4px;background-color:white;transition:.4s;border-radius:50%}
            input:checked+.slider{background-color:#2196F3}
            input:checked+.slider:before{transform:translateX(26px)}
            .setting-item{display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;padding:10px;background:#f5f5f5;border-radius:4px}
            .setting-item span{font-size:14px}
        `;

        const styleEl = document.createElement('style');
        styleEl.textContent = style;
        document.head.appendChild(styleEl);

        const oldModal = document.getElementById('yaohuo-modal-mask');
        if (oldModal) {
            oldModal.remove();
        }

        const replyListHTML = (settings.customReplies || []).map((reply, index) => `<div class="reply-item" style="display:flex;margin-bottom:8px"><input type="text" value="${reply}" style="flex:1;margin-right:8px"><button class="delete-reply" data-index="${index}">删除</button></div>`).join('');

        const modalHTML = `<div id="yaohuo-modal-mask"><div class="yaohuo-wrap"><header>🔥快捷回复🔥插件设置</header><div class="content"><div class="setting-item"><span>发送前确认</span><label class="switch"><input type="checkbox" id="requireConfirm" ${settings.requireConfirm ? 'checked' : ''}><span class="slider"></span></label></div><div class="reply-management"><h3>回复词管理</h3><div class="reply-list" style="max-height:300px;overflow-y:auto">${replyListHTML}</div><button id="add-reply" style="margin-top:10px">添加回复词</button></div></div><footer><button class="cancel-btn">取消</button><button class="ok-btn">确认</button></footer></div></div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('yaohuo-modal-mask');
        const addReplyBtn = modal.querySelector('#add-reply');
        const replyList = modal.querySelector('.reply-list');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const okBtn = modal.querySelector('.ok-btn');
        const requireConfirmCheckbox = modal.querySelector('#requireConfirm');

        if (addReplyBtn) {
            addReplyBtn.addEventListener('click', () => {
                const newReplyItem = document.createElement('div');
                newReplyItem.className = 'reply-item';
                newReplyItem.style.cssText = 'display:flex;margin-bottom:8px';
                newReplyItem.innerHTML = '<input type="text" value="" style="flex:1;margin-right:8px"><button class="delete-reply">删除</button>';
                replyList.appendChild(newReplyItem);
            });
        }

        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });

        okBtn.addEventListener('click', () => {
            settings.requireConfirm = requireConfirmCheckbox.checked;
            const replyInputs = modal.querySelectorAll('.reply-item input');
            settings.customReplies = Array.from(replyInputs)
                .map(input => input.value.trim())
                .filter(reply => reply !== '');
            localStorage.setItem('yaohuo_reply_settings', JSON.stringify(settings));
            modal.remove();
            alert('设置已保存');
            updateReplyButtons();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        replyList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-reply')) {
                e.target.closest('.reply-item').remove();
            }
        });
    }

    const retextareaElement = document.querySelector('.retextarea');
    if (!retextareaElement) return;

    const buttonStyles = {common:'margin:5px;padding:5px 10px;cursor:pointer;background-color:#007bff;color:white;border:none;border-radius:3px;transition:background-color .2s',hover:'background-color:#0056b3'};

    const styleSheet = document.createElement('style');
    styleSheet.textContent = `.quick-reply-btn{${buttonStyles.common}}.quick-reply-btn:hover{${buttonStyles.hover}}`;
    document.head.appendChild(styleSheet);

    function createReplyButton(reply) {
        const button = document.createElement('button');
        button.textContent = reply;
        button.className = 'quick-reply-btn';
        button.style.cssText = buttonStyles.common;

        button.addEventListener('click', () => {
            const sendReply = () => {
                retextareaElement.value = reply;
                const submitButton = document.querySelector('input[type="submit"]');
                if (submitButton) {
                    const form = submitButton.closest('form');
                    if (form) {
                        form.onsubmit = (e) => {
                            e.preventDefault();
                            form.submit();
                            return false;
                        };
                    }
                    submitButton.click();
                } else {
                    alert('未找到提交按钮');
                }
            };

            (!settings.requireConfirm || confirm(`确定要发送回复："${reply}"？`)) && sendReply();
        });

        return button;
    }

    function updateReplyButtons() {
        const contentWrapper = buttonContainer.querySelector('div');
        if (!contentWrapper) return;

        contentWrapper.innerHTML = '';
        (settings.customReplies || []).forEach(reply => {
            contentWrapper.appendChild(createReplyButton(reply));
        });
    }

    const inlineButton = document.createElement('div');
    inlineButton.innerHTML = '💬';
    inlineButton.title = '快速回复';



    // 悬浮球样式设置
    inlineButton.className = 'floating-reply-btn';
    inlineButton.style.cssText = 'position:fixed;bottom:80px;right:20px;width:50px;height:50px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;z-index:9998;box-shadow:0 4px 15px rgba(0,0,0,.2);transition:all .3s ease;user-select:none';
    
    inlineButton.addEventListener('mouseenter',()=>{inlineButton.style.transform='scale(1.1)';inlineButton.style.boxShadow='0 6px 20px rgba(0,0,0,.3)'});
    inlineButton.addEventListener('mouseleave',()=>{inlineButton.style.transform='scale(1)';inlineButton.style.boxShadow='0 4px 15px rgba(0,0,0,.2)'});

    // 将悬浮球直接添加到body
    document.body.appendChild(inlineButton);
    
    // 配置按钮改为隐藏，通过右键悬浮球或长按来调用
    let longPressTimer;
    let isLongPress = false;
    
    // PC端鼠标事件
    inlineButton.addEventListener('mousedown', (e) => {
        if (e.button === 2) { // 右键
            e.preventDefault();
            setMenu();
            return;
        }
        // 长按检测
        isLongPress = false;
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            setMenu();
        }, 800);
    });
    
    inlineButton.addEventListener('mouseup', (e) => {
        clearTimeout(longPressTimer);
        // 如果不是长按，则切换面板显示
        if (!isLongPress && e.button === 0) {
            setTimeout(() => {
                const newDisplay = buttonContainer.style.display === 'none' ? 'block' : 'none';
                buttonContainer.style.display = newDisplay;
                localStorage.setItem('yaohuo_panel_visible', newDisplay === 'block');
            }, 50);
        }
    });
    
    inlineButton.addEventListener('mouseleave', () => {
        clearTimeout(longPressTimer);
    });
    
    // 移动端触摸事件
    inlineButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isLongPress = false;
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            setMenu();
            // 添加触觉反馈（如果支持）
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, 800);
    });
    
    inlineButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        clearTimeout(longPressTimer);
        // 如果不是长按，则切换面板显示
        if (!isLongPress) {
            const newDisplay = buttonContainer.style.display === 'none' ? 'block' : 'none';
            buttonContainer.style.display = newDisplay;
            localStorage.setItem('yaohuo_panel_visible', newDisplay === 'block');
        }
    });
    
    inlineButton.addEventListener('touchcancel', () => {
        clearTimeout(longPressTimer);
    });
    
    // 禁用右键菜单
    inlineButton.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'quick-reply-container';
    const c=buttonContainer,s=c.style;s.cssText='width:300px;position:fixed;top:70px;right:10px;z-index:9999;background:rgba(249,249,249,.3);border:1px solid #ccc;padding:10px;border-radius:5px;max-height:50vh;overflow-y:auto;overflow-x:hidden;box-shadow:0 2px 10px rgba(0,0,0,.1)';

    const responsiveStyle = document.createElement('style');
    responsiveStyle.textContent = '@media screen and (max-width:768px){.quick-reply-container{width:90%!important;max-width:300px!important;top:70px!important;right:50%!important;transform:translateX(50%)!important;max-height:calc(80vh - 70px)!important;overflow-y:auto!important;padding:5px!important;z-index:998!important}.quick-reply-btn{font-size:12px!important;padding:6px 8px!important;margin:3px!important;white-space:nowrap!important}.quick-reply-container>div{display:flex!important;flex-wrap:wrap!important;justify-content:center!important;gap:5px!important}.floating-reply-btn{bottom:60px!important;right:15px!important;width:45px!important;height:45px!important;font-size:18px!important}}';
    document.head.appendChild(responsiveStyle);

    const isPanelVisible = localStorage.getItem('yaohuo_panel_visible') === 'true';
    buttonContainer.style.display = isPanelVisible ? 'block' : 'none';

    const contentWrapper = document.createElement('div');
    buttonContainer.appendChild(contentWrapper);





    // 修改后的点击事件：点击容器或内容区域的空白部分隐藏面板
    buttonContainer.addEventListener('click', (e) => {
        if (e.target === buttonContainer || e.target === contentWrapper) {
            buttonContainer.style.display = 'none';
            localStorage.setItem('yaohuo_panel_visible', 'false');
        }
    });

    // 仅阻止按钮点击事件冒泡
    contentWrapper.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-reply-btn')) {
            e.stopPropagation();
        }
    });

    document.body.appendChild(buttonContainer);
    updateReplyButtons();
})();