
function LoadingPage(divId, progressBarId, progressTextId) {
    this.lastValue = -1;
    this.loader = document.getElementById(divId);
    if (progressBarId) {
        this.progressBar = document.getElementById(progressBarId);
    }
    if (progressTextId) {
        this.progressText = document.getElementById(progressTextId);
    }
}

LoadingPage.prototype = {
    constructor: LoadingPage,
    setPercent: function (pct) {
        if (pct == this.lastValue) {
            return;
        }
        this.lastValue = pct;
        if (this.progressBar) {
            this.progressBar.style.width = pct + '%';
        }
        if (this.progressText) {
            this.progressText.innerHTML = pct + '%';
        }
    },
    hide: function () {
        this.loader.style.display = 'none';
        this.loader.style.visibility = 'hidden';
    }
}

export {LoadingPage};
