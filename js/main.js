var app = angular.module('app', ['ngSanitize']);

app.filter('escape', function () {
    return window.encodeURIComponent;
});

app.controller('main', function ($scope, $http) {
    function updateResults(query) {
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
            .then(function (json) {
                var autocomplete = $('#autocomplete').val();
                var query = $('input[name="q"]').val();
                $('#autocomplete').val('');

                var suggested = json.data[1][0][0];

                if (suggested != query && suggested.indexOf(query) >= 0) {
                    $('#autocomplete').val(suggested);
                }
            });

        var results_params = $.param({
            callback: 'JSON_CALLBACK',
            q: query,
            v: '1.0'
        });

        $http
            .jsonp("http://ajax.googleapis.com/ajax/services/search/web?" + results_params)
            .then(function (json) {
                $scope.serp_results = json.data.responseData.results;
            });
    }

    $scope.$watch('query', updateResults);

    jQuery(document).ready(function($) {
        $('input[name="q"]').keydown(function(event) {
            var code = event.keyCode || event.which;
            var autocomplete = $('#autocomplete').val();
            var query = $('input[name="q"]').val();

            if (code == 9) {
                event.preventDefault();

                if (autocomplete && typeof autocomplete != "undefined" && autocomplete.indexOf(query) >= 0) {
                    $('input[name="q"]').val(autocomplete);
                    updateResults(autocomplete);
                }

                return false;
            }
        });
    });
});

jQuery(document).ready(function($) {
    $('input[name="q"]').keyup(function(event) {
        // event.keyCode == 13 := enter
        if (event.keyCode == 13 && $('.serp li.focus').length > 0) {
            window.location = $('.serp li.focus a:first').attr('href');
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