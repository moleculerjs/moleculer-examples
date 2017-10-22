/* 
 * ---------------------------------------- *
 * Star Rating                              *
 * JavaScript                               *
 * v1.0                                     *
 * Matt O'Neill | www.matt-oneill.co.uk     *
 * ---------------------------------------- *
 */

(function ($) {
    $.fn.starRating = function (s) {
        return this.each(function () {
            var $ratingElement = $(this);
            $ratingElement.append("<ul />");
            var $ratingField = $(this).children("ul");
            for (var x = 0; x < $ratingElement.data("rating-max") ; x++) {
                $ratingField.append("<li>");
            }
            $ratingFieldItem = $ratingField.children();
            var rating = 0;
            $ratingFieldItem.on({
                click: function () {
                    if ($(this).index() + 1 != rating) {
                        rating = $(this).index() + 1;
                        $ratingElement.attr("data-val", rating);
                        $("li:lt(" + ($(this).index() + 1) + ")", $ratingField).addClass("active");
                        $("li:gt(" + ($(this).index()) + ")", $ratingField).removeClass("active");
                    }
                    else {
                        $(this).parent().children("li").removeClass("active");
                        $ratingElement.attr("data-val", null);
                        rating = 0;
                    }
                },
                mouseenter: function () {
                    $("li:lt(" + ($(this).index() + 1) + ")", $ratingField).addClass("hover");
                    $("li:gt(" + ($(this).index()) + ")", $ratingField).removeClass("hover");
                },
                mouseleave: function () {
                    $(this).parent().children("li:gt(" + ($(this).index()) + ")").removeClass("hover");
                }
            });
            $ratingField.on({
                mouseleave: function () {
                    $ratingFieldItem.removeClass("hover");
                }
            });
            if (s.minus) {
                $ratingElement.prepend("<span class='less'></span>");
                $("span.less", $ratingElement).on("click", function () {
                    $("li.active:last", $ratingField).removeClass("active");
                });
            }
        });
    };
}(jQuery));