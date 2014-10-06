// JQuery functions to manage form input, hebrew keyboard, validation, etc.
$(function() {
  // enable/disable chain checkboxes
  $(".nav li a").on("click", handleClick);

  $('#send_quote_button_1').on("click", function(e){ 
        $(e.target).hide(); 
        $('#price_inputs').show();
        $("#mailto").focus();
        $(window).scrollTop($(window).scrollTop()+300);
      });

  //-----------------------------
  // Functions
  //-----------------------------

  function handleClick(e) {
    var $target = $(e.target);
    var option = $target.attr('href');
    console.log(option);
    ShaderDemo.option(option);
    $(".nav li a").removeClass("active");
    $target.addClass("active");
    e.preventDefault();
    return false;
  }

  function overlay() {
    var el = document.getElementById("overlay");
    el.style.visibility = (el.style.visibility == "visible") ? "hidden" : "visible";
  }

  function refreshText() {
    var $mesg = $("#message-input");   // !!! have to include Hebrew here
    AlephTextDisplay.show($mesg.val());
    $mesg.focus().select();
  }

  // if all checkboxes are unchecked, check the default box
  function countChecked(which_group) {
    var n = $("#" + which_group + " input:checked").length;
    if (n === 0) {
      $("#" + which_group + " input[type=checkbox].default").prop("checked", true);
    }
  }

  // enable the chain metal checkboxes if user selects a chain from dropdown
  function enableChainCheckboxes() {
    var no_chain_selected = ($('#chain').val()=="0");
    var $metal_labels = $(".chainlabel.metal-cb");
    $(".chain-metal-cb").prop('disabled', ($('#chain').val()=="0")); // disable checkboxes if no chain selected
    if (no_chain_selected) {
      $metal_labels.addClass("disabled")
    }
    else {
      $metal_labels.removeClass("disabled")
    }
  }

});
