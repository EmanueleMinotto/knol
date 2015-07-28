var app = angular.module('app', ['ngSanitize', 'angulartics', 'angulartics.google.analytics']);

app.filter('escape', function() {
    return window.encodeURIComponent;
});

app.controller('main', function($scope, $http, $analytics) {
    var mainInput = $('input[name="q"]');
    var oldQuery = mainInput.val().trim();

    function updateResults() {
        var query = mainInput.val().trim();

        if (query == oldQuery) {
            return;
        }

        $analytics.eventTrack(query, {
            category: 'Query'
        });

        var results_params = $.param({
            callback: 'JSON_CALLBACK',
            q: query,
            v: '1.0'
        });

        $http
            .jsonp("http://ajax.googleapis.com/ajax/services/search/web?" + results_params)
            .then(function(json) {
                $scope.serp_results = json.data.responseData.results;
            });

        oldQuery = query;
    }

    $scope.$watch('query', function (query) {
        query = query.trim();

        if (typeof query == "undefined" || !query) {
            $('#autocomplete').val('');
            return;
        }

        var autocomplete_params = $.param({
            callback: 'JSON_CALLBACK',
            client: 'youtube',
            hl: 'en',
            q: query
        });

        $http
            .jsonp("http://suggestqueries.google.com/complete/search?" + autocomplete_params)
            .then(function(json) {
                var autocomplete = $('#autocomplete').val();
                var query = mainInput.val();
                $('#autocomplete').val('');

                var suggested = json.data[1][0][0];

                if (suggested != query && suggested.indexOf(query) >= 0) {
                    $('#autocomplete').val(suggested);
                }
            });
    });

    jQuery(document).ready(function($) {

        // setup before functions
        var typingTimer; // timer identifier
        var doneTypingInterval = 1000; // time in ms (1 second)

        // on keyup, start the countdown
        mainInput.on('keyup', function() {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(updateResults, doneTypingInterval);
        });

        // on keydown, clear the countdown 
        mainInput.on('keydown', function() {
            clearTimeout(typingTimer);
        });

        mainInput.keydown(function(event) {
            var code = event.keyCode || event.which;
            var autocomplete = $('#autocomplete').val();
            var query = mainInput.val().trim();

            if (code == 9) {
                event.preventDefault();

                if (autocomplete && typeof autocomplete != "undefined" && autocomplete.indexOf(query) >= 0) {
                    $analytics.eventTrack(query + ' => ' + autocomplete, {
                        category: 'Tab'
                    });

                    mainInput.val(autocomplete);
                    updateResults();
                }

                return false;
            }
        });

        mainInput.keyup(function(event) {
            // event.keyCode == 13 := enter
            if (event.keyCode == 13 && $('.serp li.focus').length > 0) {
                var _href = $('.serp li.focus a:first').attr('href');
                $analytics.eventTrack(_href, {
                    category: 'Location'
                });
                window.location = _href;
            }

            // event.keyCode == 38 := up
            // event.keyCode == 40 := down
            if (event.keyCode != 40 && event.keyCode != 38) {
                return;
            }

            if ($('.serp li').length == 0) {
                return;
            }

            var _old = $('.serp li.focus').index() || 0;
            var _new = _old + (event.keyCode == 40 ? 1 : -1);
            $analytics.eventTrack(event.keyCode == 40 ? 'down' : 'up', {
                category: 'Keyboard'
            });

            if (_new < 0) {
                _new = $('.serp li').length - 1;
            }
            if (_new > ($('.serp li').length - 1)) {
                _new = 0;
            }

            $('.serp li').removeClass('focus');
            $('.serp li').eq(_new).addClass('focus');
        });
    });
});