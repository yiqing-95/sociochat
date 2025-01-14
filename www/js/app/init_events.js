define(function () {
    return {
        bindEvents: function ($this) {
            $this.pingTimer = setInterval(function () {
                if (!$this.connection || $this.connection.readyState != 1) {
                    return;
                }

                $this.send({subject: 'Ping'});
            }, 15000);

            // Address reset
            $this.domElems.addressReset.click(function () {
                $this.domElems.address.children().first().attr('selected', 'selected');
                $this.domElems.address.data('id', '');
                $this.domElems.addressReset.hide();
            });

            // Select
            $this.domElems.address.on('change', function () {
                $this.domElems.address.data('id', this.value);
                if (this.value) {
                    $this.domElems.addressReset.show();
                } else {
                    $this.domElems.addressReset.hide();
                }
            });

            $this.domElems.sendMessageButton.click(function () {
                $this.sendMessage();
                $this.domElems.inputMessage.focus();
            });

            $this.domElems.inputMessage.keypress(function (e) {
                var code = e.keyCode || e.which;
                var isEnter = code == 10 || code == 13;
                var inputText = this.value;
                var ctrlEnter = e.ctrlKey && isEnter;
                var breakLine = ctrlEnter;
                var sendMessage = isEnter;

                $this.domElems.charsLeft.text($this.maxMsgLength - inputText.length);

                if ($this.user.lineBreakType == 0) {
                    breakLine = isEnter && !e.ctrlKey;
                    sendMessage = ctrlEnter;
                }

                if (breakLine) {
                    var matches = inputText.match(/(?:\r\n|\r|\n)/g);
                    return !(matches && matches.length > 3);

                }
                if (sendMessage) {
                    $this.sendMessage();
                    $this.domElems.charsLeft.text($this.maxMsgLength);
                    return false;
                }

            });

            $this.domElems.setProperties.click(function (e) {
                var command = {
                    subject: 'Properties',
                    action: 'submit',

                    tim: $this.domElems.tim.val(),
                    sex: $this.domElems.sex.val(),
                    name: $this.domElems.nickname.val(),
                    city: $this.domElems.city.val(),
                    birth: $this.domElems.birth.val(),
                    about: $this.domElems.about.val(),
                    censor: $this.domElems.censor.prop('checked') ? $this.domElems.censor.prop('checked') : false,
                    is_subscribed: $this.domElems.subscription.prop('checked') ? $this.domElems.subscription.prop('checked') : false,
                    notify_visual: $this.domElems.notifyVisual.prop('checked') ? $this.domElems.notifyVisual.prop('checked') : false,
                    notify_sound: $this.domElems.notifySound.prop('checked') ? $this.domElems.notifySound.prop('checked') : false,
                    line_break_type: $this.domElems.lineBreakType.filter(':checked').val() ? $this.domElems.lineBreakType.filter(':checked').val() : 0,
                    online_limit: $this.domElems.onlineNotification.val() ? $this.domElems.onlineNotification.val() : 0,
                    message_animation_type: $this.domElems.msgAnimationType.val() ? $this.domElems.msgAnimationType.val() : 2
                };

                $this.send(command);
                $this.returnToChat();
            });

            $this.domElems.removeAvatar.click(function (e) {
                var command = {
                    subject: 'Properties',
                    action: 'removeAvatar'
                };
                $this.send(command);
                $this.domElems.avatar.find('.avatar-placeholder').html(
                    '<div class="user-avatar"><span class="glyphicon glyphicon-user"></span></div>'
                );
            });

            $this.domElems.setRegInfo.click(function (e) {
                var command = {
                    subject: 'Login',
                    action: 'register',

                    login: $this.domElems.email.val(),
                    password: $this.domElems.password.val()
                }
                $this.send(command);
                $this.domElems.password.val('');
                $this.returnToChat();
            });

            $this.domElems.doLogin.click(function (e) {
                var command = {
                    subject: 'Login',
                    action: 'enter',

                    login: $this.domElems.loginName.val(),
                    password: $this.domElems.loginPassword.val()
                }
                $this.send(command);
                $this.domElems.loginPassword.val('');
                $this.returnToChat();
            });

            $this.domElems.doMusicSearch.click(function (e) {
                require(['audio'], function (audio) {
                    audio.process($this);
                });
            });
            $this.domElems.musicInput.on('keypress', function (e) {
                if (e.which == 13) {
                    require(['audio'], function (audio) {
                        audio.process($this);
                    });
                }
            });

            $(window).resize(function () {
                $this.scrollDown();
            });

            var checkManualScroll = function () {
                var container = $this.domElems.chat;

                if (container[0].scrollTop > (container[0].scrollHeight - 1.5 * container.height())) {
                    $this.isManualScrolling = false;
                }
            }

            $this.domElems.chat.on('touchstart', function () {
                $this.isManualScrolling = true;
            });

            $this.domElems.chat.on('touchstop', function () {
                checkManualScroll();
            });

            $this.domElems.chat.on('mousewheel', function () {
                $this.isManualScrolling = true;
                var timer = $.data(this, 'timer');
                clearTimeout($.data(this, 'timer'));
                $.data(this, 'timer', setTimeout(function () {
                    checkManualScroll();
                }, 250));
            });
        },
        bindMenus: function ($this) {
            $this.domElems.menuExit.click(function (e) {
                var command = {
                    subject: 'MainChat'
                };
                $this.send(command);
            });

            $this.domElems.menuChat.click(function () {
                $this.returnToChat();
            });

            $('.tab-panel').click(function (e) {
                e.preventDefault();
                $(this).tab('show');
            });

            $('.return-to-chat').click(function () {
                $this.returnToChat();
            });
        },

        AvatarUploadHandler: function ($this) {
            var avatar = $this.domElems.avatar;
            var uploadButtonContainer = avatar.find('.do-upload');
            var response = avatar.find('.alert');
            var placeHolder = avatar.find('.avatar-placeholder');
            var cropHolder = null;
            var jcropAPI = null;
            var dim = null;

            avatar.find('.upload').change(function () {
                var fileReader = new FileReader();
                var file = this.files[0];
                var image = new Image();


                if (jcropAPI) {
                    jcropAPI.destroy();
                }

                cropHolder = $('<div></div>');
                cropHolder.attr('style', placeHolder.attr('style'));
                placeHolder.after(cropHolder);

                fileReader.onload = function (e) {
                    placeHolder.hide();
                    image.src = e.target.result;
                };

                fileReader.onloadend = function () {
                    setTimeout(function () {
                        cropHolder.Jcrop({
                            bgColor: '#fff',
                            minSize: [64, 64],
                            maxSize: [0, 0],
                            setSelect: [0, 0, cropHolder.innerWidth(), cropHolder.innerHeight()],
                            aspectRatio: 1,
                            onSelect: function (coords) {
                                dim = coords;
                            }
                        }, function () {
                            jcropAPI = this;
                        });
                    }, 500);

                }

                fileReader.readAsDataURL(file);

                image.style.width = 'auto';
                image.style.maxHeight = 'inherit';

                cropHolder.html(image);
                uploadButtonContainer.data('file', file).show();
                response.removeClass('.alert-success').removeClass('.alert-danger').hide();
            });

            uploadButtonContainer.find('a').click(function () {
                var file = uploadButtonContainer.data('file');
                var xhr = new XMLHttpRequest();
                var formData = new FormData();
                var progressbarContainer = avatar.find('.progress');
                var progressbar = avatar.find('.progress-bar');
                var percentage = progressbar.find('.sr-only');

                var dim = jcropAPI.tellSelect();
                dim = {
                    x: dim.x,
                    y: dim.y,
                    w: dim.w,
                    h: dim.h,
                    portW: cropHolder.innerWidth(),
                    portH: cropHolder.innerHeight()
                };

                formData.append('img', file);
                formData.append('token', $this.token);
                formData.append('dim', JSON.stringify(dim));

                xhr.upload.onprogress = function (e) {
                    if (e.lengthComputable) {
                        var percent = Math.round((e.loaded * 100) / e.total);
                        progressbar.css('width', percent + '%').attr('aria-valuenow', percent)
                        percentage.html(percent + "%");
                    }
                };

                xhr.upload.onloadstart = function (e) {
                    progressbarContainer.show();
                    progressbar.css('width', '0%').attr('aria-valuenow', 0)
                    percentage.html("0%");
                }

                xhr.upload.onload = function (e) {
                    progressbarContainer.hide();
                    uploadButtonContainer.hide();
                    response.addClass('alert-info').html('Фотография обрабатывается, подождите...').show();
                }

                xhr.onload = function (e) {
                    response.removeClass('alert-info').removeClass('alert-danger');

                    jcropAPI.destroy();
                    placeHolder.show();

                    try {
                        var responseText = JSON.parse(e.target.responseText);
                    } catch (e) {
                        response.addClass('alert-danger').html('Произошла техническая ошибка').show();
                        return;
                    }

                    if (e.target.status != 200) {
                        response.addClass('alert-danger').html(responseText.response).show();
                        return;
                    }

                    response.addClass('alert-success').html(responseText.response).show();

                    var command = {
                        subject: 'Properties',
                        action: 'uploadAvatar',
                        image: responseText.image
                    }
                    $this.send(command);
                }

                xhr.open("POST", "/user/upload-avatar");
                xhr.send(formData);
            });
        }
    }
});
