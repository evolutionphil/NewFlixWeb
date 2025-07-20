//Initialize function
"use strict";
$(document).ready(function () {
    try{
        if(window.navigator.userAgent.toLowerCase().includes('web0s'))
            platform='lg'
    }catch (e) {
    }
    initKeys();
    initPlayer();

        if(platform==='samsung'){
            $('#home-page-video-preview-lg').hide();
            $('#channel-page-video-lg').hide();
            $('#catchup-page-video-lg').hide();
            $('#vod-series-player-video-lg').hide();
            $('#version-txt').text(samsung_version);
        }else if(platform==='lg'){
            $('#home-page-video-preview').hide();
            $('#channel-page-video').hide();
            $('#catchup-page-video').hide();
            $('#vod-series-player-video').hide();
            $('#version-txt').text(lg_version);
        }
        login_page.getPlayListDetail();

    window.onwheel = function(){
        return true;
    }
    var saved_parent_password=localStorage.getItem(storage_id+'parent_account_password');
    parent_account_password=saved_parent_password!=null ? saved_parent_password : parent_account_password;
    if(platform==='samsung'){
        document.addEventListener("visibilitychange", function(){
            if(document.hidden)
                webapis.avplay.suspend();
            else
                webapis.avplay.restore();
        });
    }
    else if(platform==='lg')
        document.addEventListener('keyboardStateChange', keyboardVisibilityChange, false);
    document.addEventListener('keydown', function(e) {
        if(platform==='samsung'){
            if(e.keyCode==tvKey.EXIT){
                if(current_route==='vod-series-player-video'){
                    try{
                        vod_series_player.saveVideoTime();
                    }catch (e) {
                    }
                }
                tizen.application.getCurrentApplication().exit();
            }
            switch (e.keyCode) {
                case 65376: // Done
                case 65385: // Cancel
                    $('input').blur();
                    return;
            }
        }
        if(app_loading)
            return;
        switch (current_route) {
            case "login":
                login_page.HandleKey(e);
                break;
            case "home-page":
                home_page.HandleKey(e);
                break;
            case "channel-page":
                channel_page.HandleKey(e);
                break;
            case "catch-up":
                catchup_page.HandleKey(e);
                break;
            case "vod-summary-page":
                vod_summary_page.HandleKey(e);
                break;
            case "vod-series-player-video":
                vod_series_player.HandleKey(e);
                break;
            case "trailer-page":
                trailer_page.HandleKey(e);
                break;
            case "seasons-page":
                seasons_variable.HandleKey(e);
                break;
            case "episode-page":
                episode_variable.HandleKey(e);
                break;
            case "series-summary-page":
                series_summary_page.HandleKey(e);
                break;
            case "search-page":
                search_page.HandleKey(e);
                break;
            case "parent-confirm-page":
                parent_confirm_page.HandleKey(e);
                break;
        }
    });
})

function keyboardVisibilityChange(event) {
    var visibility = event.detail.visibility;
    if(visibility){
        keyboard_displayed=true;
    }
    else{
        keyboard_displayed=false;
        $('input').blur();
    }
}
