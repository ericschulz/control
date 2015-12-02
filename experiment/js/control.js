////////////////////////////////////////////////////////////////////////
//            JS-CODE FOR DUAL CONTROL                                //
//     AUTHOR: ERIC "the King of Bayes" SCHULZ                        //
////////////////////////////////////////////////////////////////////////

//PREAMBLE: PRE-GENERATING VARIABLES

//trial number=20
var trialnum = 20;

//Collector vector of control variable
var xcollect = new Array(trialnum);
//Collector vector of trajectory
var ycollect = new Array(trialnum);
//Collector vector of scores (distance to target)
var scorecollect = new Array(trialnum);
//index counter
var ind = 0;
//score and input trackers
var xpos=1.2;
var ypos=0;
var score=0;
var scoresum=0;
var oneTrialCurrentValue = 0.0;
var exTrialCurrentValue = 0.0;

//a priori target vector
var target = [0,0,0,0,0,0,0,0,0,0,0,7,7,7,0,-7,-7,-7,0,0];
//a priori importance vector
var weights =[1,1,1,1,1,0,0,0,0,0,0,10,10,10,10,10,10,10,10,10];
//Firebase link
var database = new Firebase("https://dualcontrol.firebaseio.com/");

//Scaling for SVG axes
////X-axis
var scalex = d3.scale.linear()
                    //x goes from 0 to 20
                    .domain([0, 20])
                    .range([0, 630]);
////Y-axis
var scaley = d3.scale.linear()
                    //y goes from -10 to 10
                    .domain([-10, 10])
                    .range([675, 105]);
////////////////////////////////////////////////////////////////////////

//FUNCTION DECLARATIONS

//underlying pendulum function to be controlled
//takes in the current state x_k and produces x_{k+1}
function pendulum(x)
{
  y=0.9*x+(-1/(1+Math.exp(x+5)))+(1/(1+Math.exp(-(x+5))));
return y;
}

//function to create the stage where stimuli are presented
function makeStage(w, h, object) 
{
  //select the object by id
	var stage = d3.select(object)
  //enter SVG witth heigh h and width h
	  .insert("center")
	  .insert("svg")
	  .attr("width",w)
	  .attr("height",h);
        return stage;
}


//Draw the boat into the stage
function drawBoat(stage, x, y)
{
  //append an image to svg
   stage.append("svg:image")
   //tag it as boat
     .attr("id","boat")
     //get it from my dropbox
     .attr("xlink:href", "https://dl.dropboxusercontent.com/u/4213788/boat.png")
     //width and height is 30px
     .attr("width",  30)
     .attr("height", 30)
     //enter x and y coordinates
     .attr("x", x)
     .attr("y",y);
}
//clear the boat from current position
function clearBoat(stage)
{
  //remove items tagged as boat
  stage.select("#boat").remove();
}
//changes from one page to another
function clickStart(hide, show)
{
        //hide gets none, show gets block, window to the top  
        document.getElementById(hide).style.display="none";
        document.getElementById(show).style.display = "block";
        window.scrollTo(0,0);        
}
//draws the points in green
function drawCircle(stage, cx, cy) 
{
  //inser circle
	stage.insert("circle")
  //at cx and cy
	  .attr("cx", cx)
    .attr("cy", cy)
    //radius=2
    .attr("r", 2)
    //color is green
    .style("fill","green")
    .style("stroke","green")
    .style("stroke-width","5px");
}

//Update points by slider
function updateCircle(stage, ex, ey) 
{
    //change position of circle to new position
    stage.selectAll("circle").attr("cx", ex).attr("cy", ey);
}

//clears the points
function clearCircle(stage) 
{
  //remove all circles
	stage.selectAll("circle").remove();
}

//changes inner HTML of div with ID=x to y
function change (x,y)
{
    document.getElementById(x).innerHTML=y;
}

//changes inner HTML of div with ID=x to y
function getvalue (x)
{
   var y = document.getElementById(x).value;
   return y;
}
//Append heatmap
function heatmap(stage, x,y,w,h)
{
  //append heatmap to background from dropbix
image = stage.append("svg:image")
    .attr("xlink:href", "https://dl.dropboxusercontent.com/u/4213788/dualcontrol.png")
    .attr("width", w)
    .attr("height", h)
    .attr("x", x)
    .attr("y",y);
  return image;
}

//input marker for slider
function markinputone2(value)
{
  oneTrialCurrentValue=value;
  $('#slider1value').text(value);
  //update circle when slider changes
  updateCircle(mystage1, scalex(xpos),scaley(oneTrialCurrentValue));
}

//Slider function
$(document).ready(function() 
{

 //between -10 and 10 in steps 0f 0.1
 $('#slider1').slider(
 {
    min: -10.0,
    max: 10.0,
    step: 0.1,
    value: 0.0,
    slide: function(event, ui) 
    {
        //update value     
        markinputone2(ui.value);
    }
  }
 );
 //initialize circle
 drawCircle(mystage1, scalex(xpos),scaley(0));
 }
);

////////////////////////////////////////////////////////////////////////
//SETTING UP THE STAGE AT START

//Create main stage
var mystage1= makeStage(800,800, ".plot1");
//Insert heatmap
img=heatmap(mystage1, -100, 0, 800, 800)
//draw boat at first position
drawBoat(mystage1, scalex(xpos-1.3),scaley(ypos+1));

////////////////////////////////////////////////////////////////////////
//MAIN EXPERIMENT 

//main trial function
function dotrial1()
{
  //20 trials in total
  if (trialnum > 0) 
  {
    //move position for boat forward
    xpos=xpos+0.985;
    //get the current state of the to be controlled system
    ypos=pendulum(ypos)+oneTrialCurrentValue;
    //not higher that 10 or lower than -10
    if (ypos > 10){ypos=10;}
    if (ypos < -10){ypos=-10;}
    //next trial
    trialnum=trialnum-1;
    //clear circle
    clearCircle(mystage1);
    //clear boat
    clearBoat(mystage1);
    //draw boat at new position
    drawBoat(mystage1, scalex(xpos-1.3),scaley(ypos+1));
    //don't draw circle at last round, otherwise do
    if (trialnum>0){drawCircle(mystage1, scalex(xpos),scaley(0));}
    //track xt
    xt=oneTrialCurrentValue;
    //score
    score=Math.log(Math.pow(ypos-target[ind], 2)*weights[ind]+0.01);
    //s not smaller than 0
    var s=score;
    if (s<0){s=0;}
    //linear transform to be between 0-100
    s=Math.round(100-12.5*s);
    //sum of overall scores
    scoresum=scoresum+s;
    //track chosen controll input
    xcollect[ind]=xt;
    //track result of current system state
    ycollect[ind]=ypos;
    //collect store
    scorecollect[ind]=s;
    //update index tracker
    ind=ind+1;
    //insert total score
    var insertscore1 ="Total score: "+scoresum;
    change('totalscore',insertscore1);
    //insert current score
    var insertscore2 ="Current score: "+s;
    change('currentscore',insertscore2);
    }
    else 
    {
      //go to next page once trials are over
      clickStart('page4','page5');
    }
}

////////////////////////////////////////////////////////////////////////
//PRESENTING RESULTS AND DATA PUSH

function senddata()
{
//calculate number of saved lives overall
 var presenttotal='You have gained a total sum of '+(scoresum)+" points.";
 //calculate money earned
 var money =Math.round(scoresum)/(100*20);
 var presentmoney='This equals a total reward of $ '+money+'.';
 //show score and money
 change('result',presenttotal);
 change('money',presentmoney);
 //get demographics
 var gender=getvalue("gender");
 var age=getvalue("age");
 //Push data to Firebase
 database.push({xcollect: xcollect, ycollect: ycollect, scorecollect: scorecollect,
  age: age, gender: gender});
 //Go to final page
 clickStart('page5','page6');
}
//END
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////