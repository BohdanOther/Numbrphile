import Slideout from 'slideout';
import Api from './numbers-api.js';

var currentType = "";

var factManager = {
    offset: 0.8,
    $facts: [],
    factTemplate: "",

    init: function() {
        this.$facts = $('.cd-timeline-block');
        this.factTemplate = document.getElementById('factTemplate').innerHTML;
        this.factsContainer = $('#cd-timeline');

        // hide fact on first load
        this.hideFacts();

        //on scolling, show/animate timeline blocks when enter the viewport
        $(window).on('scroll', this._animate);
    },

    addFact: function(fact, isReloadable) {
        if (fact === null)
            return;

        var $fact = $(factManager.factTemplate
            .replace('{number}', fact.number)
            .replace('{type}', fact.typeName)
            .replace('{fact}', fact.fact)
            .replace('{data-number}', fact.rawNum)
            .replace('{data-type}', fact.type)
            .replace('{type-style}', 'fact-' + fact.type));

        if (!isReloadable)
            $fact.find('.js-load-more').hide();

        factManager.$facts.push($fact);
        factManager.factsContainer.append($fact);
    },

    onBatchLoaded: function(batch) {
        // when u click math, don't wait while it's loaded
        // switch to year
        // you'll get math facts with year.
        // dats sad :(
        if (batch.type != currentType)
            return;

        for (var i = 0; i < batch.facts.length; i++) {
            factManager.addFact(batch.facts[i]);
        }

        factManager.showFacts();
    },

    showFacts: function() {
        factManager.$facts.each(function() {
            var isVisible = factManager.isBlockVisible(this) &&
                $(this).find('.cd-timeline-img').hasClass('is-hidden');

            if (isVisible) {
                $(this).find('.cd-timeline-img, .cd-timeline-content')
                    .removeClass('is-hidden')
                    .addClass('bounce-in');
            }
        });
    },

    hideFacts: function() {
        factManager.$facts.each(function() {
            if (!factManager.isBlockVisible(this)) {
                $(this).find('.cd-timeline-img, .cd-timeline-content').addClass('is-hidden');
            }
        });
    },

    isBlockVisible: function(fact) {
        return $(fact).offset().top <= $(window).scrollTop() + $(window).height() * factManager.offset
    },

    loadDashboardFacts: function(onLoaded) {
        var facts = [];

        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();

        var hh = today.getHours();
        var tt = today.getMinutes();

        var weekday = new Array(7);
        weekday[0] = "Sunday";
        weekday[1] = "Monday";
        weekday[2] = "Tuesday";
        weekday[3] = "Wednesday";
        weekday[4] = "Thursday";
        weekday[5] = "Friday";
        weekday[6] = "Saturday";

        var monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        var todayDay = weekday[today.getDay()];

        var toLoad = 4;

        var dateFact = Api.get('date', mm + '/' + dd + '/', true)
            .then(function(f) {
                if (f != null) {
                    f.rawNum = f.number;
                    f.number = dd + '/' + mm;
                    f.fact = 'Today is ' + todayDay + ', ' + dd + ' of ' + monthNames[mm] +
                        ', and it is the day date when ' + '<span class="js-fragment">' + f.fact + '</span>';
                    facts.push(f)
                }

                toLoad--;
                if (toLoad === 0 && onLoaded)
                    onLoaded(facts);
            });

        var yearFact = Api.get('year', yyyy, true)
            .then(function(f) {
                if (f != null) {
                    f.rawNum = f.number;
                    f.fact = 'You now live in ' + yyyy + ' and it is a year when ' + '<span class="js-fragment">' + f.fact + '</span>';
                    facts.push(f)
                }

                toLoad--;
                if (toLoad === 0 && onLoaded)
                    onLoaded(facts);
            });

        var timeFact = Api.get('math', hh + '' + tt, true)
            .then(function(f) {
                if (f != null) {
                    f.rawNum = f.number;

                    var fhh = hh < 10 ? '0' + hh : hh;
                    var ftt = tt < 10 ? '0' + tt : tt;

                    f.number = fhh + ':' + ftt;
                    f.fact = 'It is ' + f.number + ' now and ' + hh + '' + tt + ' number is ' + '<span class="js-fragment">' + f.fact + '</span>';
                    facts.push(f)
                }

                toLoad--;
                if (toLoad === 0 && onLoaded)
                    onLoaded(facts);
            });

        var pageLoadFact = Api.get('trivia', pageLoadTime)
            .then(function(f) {
                if (f != null) {
                    f.rawNum = f.number;
                    f.fact = f.number + " miliseconds it took to load this page and it is " +
                        '<span class="js-fragment">' + f.fact + '</span>';

                    facts.push(f)
                }

                toLoad--;
                if (toLoad === 0 && onLoaded)
                    onLoaded(facts);
            });
    },

    _animate: function() {
        if (!window.requestAnimationFrame) {
            // if we can draw - just draw
            setTimeout(function() {
                factManager.showFacts();
            }, 100)

        } else {
            // if not - request animation
            window.requestAnimationFrame(function() {
                factManager.showFacts();
            });
        }
    }
};

var infiniteLoadManager = {
    offset: 0.8,
    preloadCount: 5,
    isStopped: true,

    init: function() {
        $(window).on('scroll', this._preload);

        // prevent scrolling when loading facts.
        // i.e: we reached bottom, wait until some facts loaded
        $('html, body').on('touchstart touchmove', function(e) {
            if (Api.isLoading())
                e.preventDefault();
        });
    },

    stop: function() {
        this.isStopped = true;
    },

    start: function() {
        this.isStopped = false;
    },

    _preload: function() {
        if (infiniteLoadManager.isStopped)
            return;

        var a = $(window).scrollTop();
        var b = $(document).height() - $(window).height();
        b *= infiniteLoadManager.offset;

        if (a > b && !Api.isLoading()) {
            Api.getMany(5, currentType)
                .then(factManager.onBatchLoaded);
        }
    }
}

var slideMenuManager = {
    init: function() {
        $('.menu').show();

        var slideout = new Slideout({
            'panel': window.document.getElementById('panel'),
            'menu': window.document.getElementById('menu'),
            'padding': 240,
            'tolerance': 90,
            'fx': 'ease-out'
        });

        $('.js-slideout-toggle').on('click', function() {
            slideout.toggle();
        });

        // close menu after menu link is clicked
        $('.menu').on('click', function(event) {
            if (event.target.nodeName === 'A') {
                slideout.close();
            }
        });
    }
}

var startManager = {
    dashboard: function() {
        factManager.loadDashboardFacts(function(f) {
            // clear facts and scroll to top
            $('#cd-timeline').empty();
            $('body, html').scrollTop(0);

            // show spinner
            $('.js-spinner').removeClass('hidden');
            $('.cd-container').addClass('hidden');

            for (var i = 0; i < f.length; i++) {
                factManager.addFact(f[i], true);
            }

            // hide spinner
            $('.js-spinner').addClass('hidden');
            $('.cd-container').removeClass('hidden');

            factManager.showFacts();
        });
    }
};

$(function() {
    pageLoadTime = Date.now() - pageLoadTime;

    slideMenuManager.init();
    factManager.init();
    infiniteLoadManager.init();

    startManager.dashboard();

    // TODO: PROOF OF CONCEPT
    $('.js-dashboard').on('click', function() {
        if (Api.isLoading())
            return;
        infiniteLoadManager.stop();
        startManager.dashboard();
    });

    // TODO: PROOF OF CONCEPT
    $('.js-numberphile').on('click', function() {
        if (Api.isLoading())
            return;

        //  $('.js-numberphile')
        currentType = $(this).data('type');

        // clear facts and scroll to top
        $('#cd-timeline').empty();
        $('body, html').scrollTop(0);

        // show spinner
        $('.js-spinner').removeClass('hidden');
        $('.cd-container').addClass('hidden');

        Api.getMany(15, currentType)
            .then(function(batch) {
                factManager.onBatchLoaded(batch);

                // hide spinner
                $('.js-spinner').addClass('hidden');
                $('.cd-container').removeClass('hidden');

                infiniteLoadManager.start();
            });
    });

    $('#cd-timeline').on('click', '.js-load-more', function() {
        var more = $(this),
            num = more.data('number'),
            type = more.data('type');

        Api.get(type, num)
            .then(function(f) {
                if (f != null) {
                    more.parent().find('.js-fragment').html(f.fact);
                }
            });
    });
});