	$(document).ready(function(){ 
		var lesson=cardtea.id;
		$('.subData').on('click',function(){  
			var userName=$('input[name=userName]').val(),
			userPhone=$('input[name=userPhone]').val(),
			userAddress=$('textarea[name=userAddress]').val();
			if(!userName||!userPhone||!userAddress){ 
				alert('请填写完整信息');
				return false;
			}
			if(!isMobile(userPhone)){ 
				alert('请填写正确的号码');
				return false;
			}
			var userInfo={ 
				name : userName,
				phone :userPhone,
				address :userAddress
			};
			var jsonInfo=JSON.stringify(userInfo);
			$('[name="json"]').attr('value',jsonInfo);
			
			$('.address').hide();
			$('.success').show();
		});

		function isMobile(str){
                var mobilePattern = '^0*'
                + '(13|15|18|14|17)'
                + '('
                + '\\d{9}|' // 13800138000
                + '\\d-\\d{3}-\\d{5}|' // 138-001-38000
                + '\\d-\\d{4}-\\d{4}|' // 138-0013-8000
                + '\\d{2}-\\d{3}-\\d{4}|' // 1380-013-8000
                + '\\d{2}-\\d{4}-\\d{3}' // 1380-0138-000
                + ')$';
        var mobileRegExp = new RegExp(mobilePattern);
        if (!str) {
            return false;
        }else {
            return mobileRegExp.test(str);
        }
    };
	});