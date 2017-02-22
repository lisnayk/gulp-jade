$(document).ready(function() {
	var templ = $(".countdown-container").html();

	$('.countdown-container').countdown('2017/04/25', function(event) {
		$(this).html(event.strftime(templ));
	});

	$('.grid-slides .lightgallery').justifiedGallery({
		rel: 'gallery1', //replace with 'gallery1' the rel attribute of each link
		margins: 5
	}).on('jg.complete', function() {
		$(this).find('a').colorbox({
			maxWidth: '80%',
			maxHeight: '80%',
			opacity: 0.8,
			transition: 'elastic',
			current: ''
		});


		$(".grid-slides .lightgallery").show();
		$(".grid-slides .loader").hide();

	});

	$("a[href*='#']").mPageScroll2id({
		offset: 50
	});

console.log("yguyuytyut");
});