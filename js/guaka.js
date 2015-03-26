
(function(){ 
	var canvas,context;
	var hasTouch="ontouchstart" in window;
	var isDrag=false;//为false的时候 move事件监听的函数不执行
	var offsetL,offsetT;
	var card = new Card();
	var code,result;
	getData();
    
	function initCanvas(){ 
		
		$('.e-wrap').append('<canvas id="maskCanvas"></canvas>');
		canvas = document.getElementById('maskCanvas');
		context = canvas.getContext("2d");
		var img=document.getElementsByClassName('maskImg')[0];
		var	maskImg=$('.maskImg');
		var image=new Image();
		
		image.onload=function () {
			var wrapWidth=$('.e-wrap').width(),
			wrapHeight=$('.e-wrap').height();
			$('.e-wrap').width(wrapWidth);
			$('.e-wrap').height(wrapHeight);
			var canWid=$('.e-wrap').width();
			var canHei=$('.e-wrap').height();
			offsetL=getElementPos(canvas).left;
			offsetT=getElementPos(canvas).top;

		    canvas.width=canWid;
		    canvas.height=canHei;
		    context.drawImage(image,0,0,image.width,image.height,0,0,canWid,canHei);
		    maskImg.css('display','none');
			addEvent();
		    
		}
		image.src=maskImg.attr('src');
		
		
	}
	function getData(){ 
		var lesson=cardtea.id;
		$.ajax({ 
			type : "GET",
			url : "http://nc008x.corp.youdao.com:28085/course/cardtea/submit.json?lesson="+lesson,
			dataType : "jsonp",
			success : function(data){ 
				code=parseInt(data.code);
				result=parseInt(data.result);
				//code=1;result=5;
				switch(result){
					case 6 :
						card.setResultBg(result,code);
						initCanvas();
						break;
					case 1:
						card.setResultBg(result,code);
						initCanvas();
						break; 
					case 3 :
						alert('服务器繁忙,请稍后再试');
						scene.go('page1');
						break;
					case 4 :
						card.dialogTips('http://shared.ydstatic.com/xue/special/tea_test/images/sad_tou.png','<h3>奖品已经发放完</h3>');
						break;
					case 5 :
						card.dialogTips('http://shared.ydstatic.com/xue/special/tea_test/images/happy_tou.png','<h3>您已经领取过本次奖品</h3>');
						break;
					
					default : 
						console.log('default');
				}
			}
		});
	}
	function addEvent(){

		var	start_ev = hasTouch ? "touchstart" : "mousedown";
		var move_ev = hasTouch ? "touchmove" : "mousemove";
		var end_ev = hasTouch ? "touchend" : "mouseup";

		canvas.addEventListener(start_ev,startEvent,false);
		canvas.addEventListener(move_ev,moveEvent,false);
		canvas.addEventListener(end_ev,endEvent,false);
	}
	function startEvent(e){
		e.preventDefault();
		offsetL=getElementPos(canvas).left;
		offsetT=getElementPos(canvas).top;
		var posX,posY;
		if(hasTouch){ 
			posX=e.touches[0].pageX-offsetL;
			posY=e.touches[0].pageY + $("#page3").scrollTop() - offsetT;;
		}
		else{ 
			posX=e.pageX-offsetL;
			posY=e.pageY+ $("#page3").scrollTop()-offsetT;
		}
		context.beginPath();
		context.moveTo(posX,posY);

		isDrag=true;
	}
	function moveEvent(e){ 
		e.preventDefault();
		if(isDrag){
			var movX,movY;
			if(hasTouch){ 
				movX=e.touches[0].pageX-offsetL;
				movY=e.touches[0].pageY  + $("#page3").scrollTop() -offsetT;
			}
			else{ 
				movX=e.pageX-offsetL;
				movY=e.pageY  + $("#page3").scrollTop() -offsetT;
			}	
			context.globalCompositeOperation = "destination-out";
        	context.strokeStyle = '#fcfcfc';
        	context.lineJoin="round";
        	context.lineWidth=10;
		    context.lineTo(movX,movY);
		    context.stroke();
		}
	}
	function endEvent(e){ 
		e.preventDefault();
		isDrag=false;
		context.closePath();
		getRatio();
	}

	//选取中间1/3的像素计算alpha值为0的比例
	function getRatio(){ 
		var imagedata=context.getImageData(0,0,canvas.width,canvas.height),
			d = imagedata.data,
			dl=d.length,
			startIndex=parseInt(dl/3),
		 	endIndex=parseInt(dl/3*2),
		    k=0;  
	    for (var i = startIndex+3; i <endIndex; i += 4) {
	      if(d[i]==0){k++;}
	    }
	    var ratio=k/(startIndex/4);
	    if(ratio>0.4){ 
	    	ratio=0;
	    	$('#maskCanvas').hide();
	    	//winTips(0);
	    	card.winWhat(result);
	    }
	}

	
	function getElementPos(element){
		var actualLeft = element.offsetLeft;
		var current = element.offsetParent;
		while (current !== null){
			actualLeft += current.offsetLeft;
			current = current.offsetParent;
		}
		var actualTop = element.offsetTop;
		var current = element.offsetParent;
		while (current !== null){
			actualTop += current.offsetTop;
			current = current.offsetParent;
		}
		return {
			top : actualTop,
			left : actualLeft
		};
	}
	
	

function Card(){ 
	this.winWhat = function(){ //中了几等奖-提示
		if(result==6){ 
			card.dialogTips('http://shared.ydstatic.com/xue/special/tea_test/images/sad_tou.png','<h4>没中奖</h4><p>刮破手了，好好养伤，下期再战</p>');
		}
		else{
			switch(code){ 
				case 0 :
					this.dialogTips(cardtea.prize[0].img,'<h2>特等奖</h2><p>您的手不是手，是仙人爪呀，<br/>刮中唯一的特等奖，将获得<span>'+cardtea.prize[0].text+'</span></p>');
					break;
				case 1 :
					this.dialogTips(cardtea.prize[1].img,'<h2>一等奖</h2><p>您的手不是手，是仙人爪呀，<br/>刮中一等奖，将获得<span>'+cardtea.prize[1].text+'</span></p>');
					break;
				case 2 :
					this.dialogTips(cardtea.prize[2].img,'<h2>二等奖</h2><p>您的手不是手，是仙人爪呀，<br/>刮中二等奖，将获得<span>'+cardtea.prize[2].text+'</span></p>');
					break;
				case 3 :
					this.dialogTips(cardtea.prize[3].img,'<h2>三等奖</h2><p>您的手不是手，是仙人爪呀，<br/>刮中三等奖，将获得<span>'+cardtea.prize[3].text+'</span></p>');
					break;
			}
			$('.dialog img').css({ 
				position : "absolute",
				width :"100%",
				top:"0px",
				left:"0px"
			});
			$('.dialog .dynamicHtml').css({ 
				padding: "1.4rem .2rem .3rem .2rem"
			});
			$('.submit-info').show();
		}
		
	};
	this.dialogTips = function(img,html){ //提示框内容设置
		$('.close').on('click',function(){ 
			$('.dialog').hide();
			$('.card-mask').hide();
		});
		$('.dialog').show();
		$('.card-mask').show();
		$('.dialog img').attr('src',img);
		$('.dialog .dynamicHtml').html(html);
		if(result==5){ 
			$('.reminder').show();
		}
	};
	this.setResultBg = function(){ 		//设置刮刮卡的底部结果
		var wrapWidth=$('.e-wrap').width(),
			wrapHeight=$('.e-wrap').height();
			$('.result').css({lineHeight:wrapHeight+'px'});
		$('.result').css({ 
				backgroundColor :'#ffcf83',
				width : wrapWidth,
				height : wrapHeight,
				borderRadius : '5px',
				border :' 5px solid #fff',
				lineHeight :wrapHeight+'px'
		});
		if(result==6){ 
			$('.result').html('谢谢参与');
		}
		else{
			switch(code){ 
				case 0 : 
					$('.result').html('特等奖');
					break;
				case 1 : 
					$('.result').html('一等奖');
					break;
				case 2 : 
					$('.result').html('二等奖');
					break;
				case 3 : 
					$('.result').html('三等奖');
					break;
				default :
					$('.result').html('谢谢参与');
			}
		}
		
	};
}

})();
