	scene.define({ 
	name : "page2",
	events : { 
		"click .q-answer li" : "result",
	},
	enter : function(){ 
		$('.q-question').show();
		$('.q-false').hide();
	},
	result : function(){ 
		var rid=cardtea.rightOption;
		var id=$(this).index();
		var attr=$('.q-answer li').eq(rid-1).html();
		$('.q-false h4').html(attr);
		if((id+1) != rid){ 
			$('.q-question').hide();
			$('.q-false').show();
		}
		else{ 
			scene.go("page3"); 
		}
	}
})