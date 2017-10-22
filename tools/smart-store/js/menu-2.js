
// <![CDATA[
function FloatMenu(){
  var animationSpeed=1500;
  var animationEasing='easeOutQuint';
  var scrollAmount=$(document).scrollTop();
  var newPosition=menuPosition+scrollAmount;
  if($(window).height()<$('#dc_expr_menu').height()+$('#fl_menu .dc_em_body').height()){
    $('#dc_expr_menu').css('top',menuPosition);
  } else {
    $('#dc_expr_menu').stop().animate({top: newPosition}, animationSpeed, animationEasing);
  }
}
$(window).load(function() {
  menuPosition=$('#dc_expr_menu').position().top;
  FloatMenu();
});
$(window).scroll(function () { 
  FloatMenu();
});

$(function() {
  var fadeSpeed=500;
  $("#dc_expr_menu").hover(
	function(){ //mouse over
	  $('#dc_expr_menu .dc_em_label').fadeTo(fadeSpeed, 1);
	  $("#dc_expr_menu .dc_em_body").fadeIn(fadeSpeed);
	},
	function(){ //mouse out
	  $('#dc_expr_menu .dc_em_label').fadeTo(fadeSpeed, 0.75);
	  $("#dc_expr_menu .dc_em_body").fadeOut(fadeSpeed);
	}
  );
});

// ]]>