// ==PREPROCESSOR==
// @name 'Seekbar Panel'
// @author 'TheQwertiest'
// ==/PREPROCESSOR==

g_script_list.push('Control_Scrollbar.js');

g_properties.add_properties(
    {
        show_remaining_time: ['user.seekbar.show_remaining_time', true]
    }
);

// Tunable vars
var seekbarH = 14;
var seekbarTextW = 70;
var volumeBarH = 14;
var volumeBarW = 70;

// Internal vars
var buttons;
var showTooltips = false;
var volumeBar;
var seekbar_obj;
var seekbarTime1 = '0:00';
var seekbarTime2 = '0:00';

var cur_minimode = pss_switch.minimode.state;

/// Reduce move
var moveChecker = new _.moveCheckReducer;

createButtonImages();

function on_paint(gr) {
    gr.FillSolidRect(0, 0, ww, wh, pssBackColor);
    gr.SetTextRenderingHint(TextRenderingHint.ClearTypeGridFit);

    // SeekBar
    var p = 5;
    var x = seekbar_obj.x,
        y = seekbar_obj.y,
        w = seekbar_obj.w,
        h = seekbar_obj.h;

    var sliderBackColor = _.RGB(37, 37, 37);
    var sliderBarColor = _.RGB(110, 112, 114);

    var bool = (fb.IsPlaying && fb.PlaybackTime),
        metadb = fb.GetFocusItem(),
        playbackTimeRemaining = bool ? fb.TitleFormat('[%playback_time_remaining%]').Eval() : '0:00',
        timeRemaining = ((playbackTimeRemaining !== '0:00' ? '-' : ' ') + playbackTimeRemaining),
        isStream = (bool && (_.startsWith(fb.GetNowPlaying().RawPath, 'http://'))),
        length = (fb.IsPlaying ? (!fb.PlaybackTime ? '0:00' : fb.TitleFormat('%length%').Eval()) : metadb && fb.TitleFormat('$if(%length%,%length%,0:00)').EvalWithMetadb(metadb)),
        sliderTextColor = (fb.IsPlaying ? _.RGB(130, 132, 134) : _.RGB(80, 80, 80));
    var time2 = isStream ? 'stream' : (g_properties.show_remaining_time && playbackTimeRemaining ? timeRemaining : ' ' + length);

    if (!seekbar_obj.drag) {
        seekbarTime1 = ((fb.IsPlaying && fb.PlaybackTime) ? fb.TitleFormat('%playback_time%').Eval() : '0:00');
        seekbarTime2 = (fb.IsPlaying ? (fb.IsPlaying && seekbarTime1 === '0:00' ? '-' + fb.TitleFormat('%length%').Eval() : time2) : (metadb ? ' ' + length : ' 0:00'));
    }

    var sliderBarHoverColor = _.RGBA(151, 153, 155, seekbar_obj.hover_alpha);
    gr.FillSolidRect(x, y + p, w, h - p * 2, sliderBackColor);
    if (fb.IsPlaying && fb.PlaybackLength > 0) {
        gr.FillSolidRect(x, y + p, seekbar_obj.pos(), h - p * 2, sliderBarColor);
        gr.FillSolidRect(x, y + p, seekbar_obj.pos(), h - p * 2, sliderBarHoverColor);
    }

    var seekbarTextFont = gdi.font('Consolas', 14, 1);
    gr.DrawString(seekbarTime1, seekbarTextFont, sliderTextColor, x - seekbarTextW, y - 1, seekbarTextW, h, g_string_format.align_center);
    gr.DrawString(seekbarTime2, seekbarTextFont, sliderTextColor, x + w, y - 1, seekbarTextW, h, g_string_format.align_center);

    // VolBar
    if (cur_minimode === 'Full') {
        var x = volumeBar.x,
            y = volumeBar.y,
            w = volumeBar.w,
            h = volumeBar.h;

        var volBarHoverColor = _.RGBA(151, 153, 155, volumeBar.hover_alpha);

        gr.FillSolidRect(x, y + p, w, h - p * 2, sliderBackColor);
        gr.FillSolidRect(x, y + p, volumeBar.pos(), h - p * 2, sliderBarColor);
        gr.FillSolidRect(x, y + p, volumeBar.pos(), h - p * 2, volBarHoverColor);
    }

    buttons.paint(gr);
}

function on_size() {
    ww = window.Width;
    wh = window.Height;

    createButtonObjects(0, 0, ww, wh);

    var volumeBarX = ww - volumeBarW - 35;
    var volumeBarY = Math.floor(wh / 2 - volumeBarH / 2) + 2;
    volumeBar = new _.volume(volumeBarX, volumeBarY, volumeBarW, volumeBarH);
    volumeBar.show_tt = showTooltips;

    if (cur_minimode === 'Full') {
        var textW = seekbarTextW;
        var gap = 80;
        var seekbarW = volumeBarX - textW * 2 - gap;
    }
    else {
        var textW = seekbarTextW - 10;
        var gap = 70;
        var seekbarW = ww - textW * 2 - gap;
    }

    var seekbarY = Math.floor(wh / 2 - seekbarH / 2) + 2;
    seekbar_obj = new _.seekbar(textW, seekbarY, seekbarW, seekbarH);
    seekbar_obj.show_tt = showTooltips;
}

function on_mouse_wheel(delta) {
    if (!volumeBar.wheel(delta)) {
        if (delta > 0)
            fb.VolumeUp();
        else
            fb.VolumeDown();
    }
}

function on_mouse_move(x, y, m) {
    if (moveChecker.isSameMove(x, y, m)) {
        return;
    }

    qwr_utils.DisableSizing(m);

    seekbar_obj.move(x, y);

    if (seekbar_obj.drag) {
        seekbarTime1 = timeFormat(fb.PlaybackLength * seekbar_obj.drag_seek, true);
        seekbarTime2 = timeFormat(fb.PlaybackLength - fb.PlaybackLength * seekbar_obj.drag_seek, true);
        if (seekbarTime2 !== '0:00')
            seekbarTime2 = '-' + seekbarTime2;
        else
            seekbarTime2 = ' ' + seekbarTime2;

        // For seekbarTime refresh
        window.Repaint();

        return;
    }

    buttons.move(x, y);

    if (cur_minimode === 'Full')
        volumeBar.move(x, y);
}

function on_mouse_lbtn_down(x, y, m) {
    buttons.lbtn_down(x, y);
    seekbar_obj.lbtn_down(x, y);
    if (cur_minimode === 'Full')
        volumeBar.lbtn_down(x, y);
}

function on_mouse_lbtn_up(x, y, m) {
    qwr_utils.EnableSizing(m);

    buttons.lbtn_up(x, y);
    seekbar_obj.lbtn_up(x, y);
    if (cur_minimode === 'Full')
        volumeBar.lbtn_up(x, y);
}

function on_mouse_lbtn_dblclk(x, y, m) {
    on_mouse_lbtn_down(x, y, m);
}

function on_mouse_leave() {
    if (seekbar_obj.drag || volumeBar.drag) {
        return;
    }

    buttons.leave();
    seekbar_obj.leave();
    volumeBar.leave();
}

function on_playback_starting(cmd, is_paused) {
    seekbar_obj.playback_start();
}

function on_playback_pause(isPlaying) {
    seekbar_obj.playback_pause(isPlaying);
}

function on_playback_stop(reason) {
    seekbar_obj.playback_stop();
    // For seekbarTime refresh
    window.Repaint();
}

function on_playback_seek() {
    seekbar_obj.playback_seek();
    // For seekbarTime refresh
    window.Repaint();
}

function on_volume_change(val) {
    if (cur_minimode === 'Full') {
        buttons.refresh_vol_button();
        volumeBar.volume_change();
    }
}

function on_playback_order_changed(id) {
    buttons.refresh_shuffle_button();
    buttons.refresh_repeat_button();
}

function createButtonObjects(wx, wy, ww, wh) {
    if (buttons)
        buttons.reset();

    buttons = new _.buttons();
    buttons.show_tt = showTooltips;

    var w = btnImg.Repeat.normal.Width;
    var y = Math.floor(wh / 2 - w / 2) + 1;
    var h = w;
    var p = 9;

    var rightMargin = (cur_minimode !== 'Full') ? ((w + p) * 2 + 2) : (6 + (w + p) * 2 + 6 + (volumeBarW + 35));
    var x = ww - rightMargin;

    var repeatImg;
    if (plman.PlaybackOrder === g_playback_order.repeat_playlist)
        repeatImg = btnImg.RepeatPlaylist;
    else if (plman.PlaybackOrder === g_playback_order.repeat_track)
        repeatImg = btnImg.Repeat1;
    else
        repeatImg = btnImg.Repeat;

    var repeatFn = function () {
        var pbo = plman.PlaybackOrder;
        if (pbo === g_playback_order.default)
            plman.PlaybackOrder = g_playback_order.repeat_playlist;
        else if (pbo === g_playback_order.repeat_playlist)
            plman.PlaybackOrder = g_playback_order.repeat_track;
        else if (pbo === g_playback_order.repeat_track)
            plman.PlaybackOrder = g_playback_order.default;
        else
            plman.PlaybackOrder = g_playback_order.repeat_playlist;
    };
    buttons.buttons.repeat = new _.button(x, y, w, h, repeatImg, repeatFn, 'Repeat');

    var shuffleFn = function () {
        var pbo = plman.PlaybackOrder;
        if (pbo !== g_playback_order.shuffle_tracks)
            plman.PlaybackOrder = g_playback_order.shuffle_tracks;
        else
            plman.PlaybackOrder = g_playback_order.default;
    };
    buttons.buttons.shuffle = new _.button(x + (w + p), y, w, h, (plman.PlaybackOrder === g_playback_order.shuffle_tracks) ? btnImg.ShuffleTracks : btnImg.Shuffle, shuffleFn, 'Shuffle');

    if (cur_minimode === 'Full') {
        var volValue = _.toVolume(fb.Volume);
        var volImage = ((volValue > 50) ? btnImg.VolLoud : ((volValue > 0) ? btnImg.VolQuiet : btnImg.VolMute));
        buttons.buttons.mute = new _.button(ww - 30, y, w, h, volImage, function () { fb.VolumeMute(); }, volValue === 0 ? 'Unmute' : 'Mute');
    }

    buttons.refresh_repeat_button = function () {
        var repeatImg;
        if (plman.PlaybackOrder === g_playback_order.repeat_playlist)
            repeatImg = btnImg.RepeatPlaylist;
        else if (plman.PlaybackOrder === g_playback_order.repeat_track)
            repeatImg = btnImg.Repeat1;
        else
            repeatImg = btnImg.Repeat;

        buttons.buttons.repeat.set_image(repeatImg);
        buttons.buttons.repeat.repaint();
    };

    buttons.refresh_shuffle_button = function () {
        buttons.buttons.shuffle.set_image((plman.PlaybackOrder === g_playback_order.shuffle_tracks) ? btnImg.ShuffleTracks : btnImg.Shuffle);
        buttons.buttons.shuffle.repaint();
    };

    buttons.refresh_vol_button = function () {
        var volValue = _.toVolume(fb.Volume);
        var volImage = ((volValue > 50) ? btnImg.VolLoud : ((volValue > 0) ? btnImg.VolQuiet : btnImg.VolMute));
        buttons.buttons.mute.set_image(volImage);
        buttons.buttons.mute.tiptext = fb.Volume === -100 ? 'Unmute' : 'Mute';
        buttons.buttons.mute.repaint();
    };
}

function createButtonImages() {
    var fontGuifx = gdi.font(g_guifx.name, 18);
    var c = [250, 250, 250];

    var default_ico_colors =
        [
            _.RGBA(c[0], c[1], c[2], 35),
            _.RGBA(c[0], c[1], c[2], 155),
            _.RGBA(c[0], c[1], c[2], 105)
        ];

    var accent_ico_colors =
        [
            _.RGBA(255, 220, 55, 155),
            _.RGBA(255, 220, 55, 225),
            _.RGBA(255, 220, 55, 105)
        ];

    var btn =
        {
            Repeat:
                {
                    ico:  g_guifx.repeat,
                    font: fontGuifx,
                    id:   'playback',
                    w:    24,
                    h:    24
                },
            Repeat1:
                {
                    ico:         g_guifx.repeat1,
                    font:        fontGuifx,
                    id:          'playback',
                    w:           24,
                    h:           24,
                    is_accented: true
                },
            RepeatPlaylist:
                {
                    ico:         g_guifx.repeat,
                    font:        fontGuifx,
                    id:          'playback',
                    w:           24,
                    h:           24,
                    is_accented: true
                },
            Shuffle:
                {
                    ico:  g_guifx.shuffle,
                    font: fontGuifx,
                    id:   'playback',
                    w:    24,
                    h:    24
                },
            ShuffleTracks:
                {
                    ico:         g_guifx.shuffle,
                    font:        fontGuifx,
                    id:          'playback',
                    w:           24,
                    h:           24,
                    is_accented: true
                },
            VolLoud:
                {
                    ico:  g_guifx.volume_up,
                    font: fontGuifx,
                    id:   'playback',
                    w:    24,
                    h:    24
                },
            VolQuiet:
                {
                    ico:  g_guifx.volume_down,
                    font: fontGuifx,
                    id:   'playback',
                    w:    24,
                    h:    24
                },
            VolMute:
                {
                    ico:         g_guifx.mute,
                    font:        fontGuifx,
                    id:          'playback',
                    w:           24,
                    h:           24,
                    is_accented: true
                }
        };

    btnImg = [];

    _.forEach(btn, function (item, i) {
        var w = item.w,
            h = item.h;

        var stateImages = []; //0=normal, 1=hover, 2=down;

        for (var s = 0; s <= 2; s++) {
            var ico_color = item.is_accented ? accent_ico_colors[s] : default_ico_colors[s];

            var img = gdi.CreateImage(w, h);
            var g = img.GetGraphics();
            g.SetSmoothingMode(SmoothingMode.HighQuality);
            g.SetTextRenderingHint(TextRenderingHint.ClearTypeGridFit);
            g.FillSolidRect(0, 0, w, h, pssBackColor); // Cleartype is borked, if drawn without background

            g.DrawString(item.ico, item.font, ico_color, 0, 0, w, h, g_string_format.align_center);

            img.ReleaseGraphics(g);
            stateImages[s] = img;
        }

        btnImg[i] =
            {
                normal:  stateImages[0],
                hover:   stateImages[1],
                pressed: stateImages[2]
            };
    });
}

function on_mouse_rbtn_up(x, y) {
    var cmm = new Context.MainMenu();

    cmm.append_item(
        'Show time remaining',
        function() {
            g_properties.show_remaining_time = !g_properties.show_remaining_time;
            window.Repaint();
        },
        {is_checked:g_properties.show_remaining_time}
    );

    if (cur_minimode === 'Full') {
        cmm.append_item(
            'Show music spectrum',
            function() {
                pss_switch.spectrum.state = pss_switch.spectrum.state === 'Show' ? 'Hide' : 'Show';
            },
            {is_checked:pss_switch.spectrum.state === 'Show'}
        );
    }

    if (utils.IsKeyPressed(VK_SHIFT)) {
        qwr_utils.append_default_context_menu_to(cmm);
    }

    cmm.execute(x,y);
    cmm.dispose();

    return true;
}

function on_notify_data(name, info) {
    switch (name) {
        case 'minimode_state': {
            cur_minimode = info;
            break;
        }
        case 'show_tooltips': {
            showTooltips = info;
            buttons.show_tt = showTooltips;
            seekbar_obj.show_tt = showTooltips;
            volumeBar.show_tt = showTooltips;
            break;
        }
    }
}

pss_switch.spectrum.refresh();