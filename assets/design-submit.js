RIPT.designSubmit = (function(RIPT, $){

    // Page data object.
    var vue = new Vue({
        el: '#submission-form',
		
		data: {
            shirtColor: '',
            colors: []
		},
        methods: {
            selectColor: function(color) {
                this.shirtColor = color
            }
        }
    });

    function loadData()
    {
        $.get(RIPT.settings.apiUrl + 'shopify/submissions/colors', function(colors) {
            vue.colors = colors;
            vue.shirtColor = colors[0];
            console.log(vue.$el)

            $('.load-design-data').fadeIn();
        });
    }

    // Format the keywords box after a suggestion has been selected.
	function formatKeywords(suggestion, end) {

		// Set the last keyword in the list to the suggestion.
		var words = $('#keywords').val().split(',');
		words[words.length - 1] = suggestion;

		// Remove any extraneous spaces.
		for(var i=0; i<words.length; i++) {
			words[i] = words[i].trim();
		}

    	// Create the new comma separated list.
        var val = words.join(', ');
        if(val.length > 0 && end != undefined)
            val += ', ';

    	$('#keywords').val(val);
	}

    function bindEvents() {
        
        $("#keywords" ).autocomplete({
            minLength: 1,
            source: function(req, add){
                    
                var words = req.term.split(',');
                var lastWord = words[words.length - 1].trim();

                // Clear the list and stop processing.
                if(lastWord.length == 0) {
                    add([]);
                    return;
                }

                // Get suggestions from the backend.
                var url = RIPT.settings.apiUrl + 'shopify/tags/' + lastWord;
                $.get(url, {}, function(data) {
                            
                    var suggestions = [];
                    $.each(data, function(i, val) {                              
                        suggestions.push(val.name);
                    });

                    add(suggestions);

                }, 'json');
                            
            },
            focus: function(e, ui) {
                e.preventDefault();
                formatKeywords(ui.item.label);
            },
            select: function(e, ui) {
                e.preventDefault();
                formatKeywords(ui.item.label, true)
            }
        });

        // Trigger a click for dropzone container.
        $('#upload-trigger').on('click', function() {
            $('#upload-drop').trigger('click');
        });

        // Setup dropzone on the receiving container for the thumbnail.
        Dropzone.autoDiscover = false;
        $("#upload-drop").dropzone({

            url: RIPT.settings.apiUrl + "shopify/submissions/graphic",
            acceptedFiles: "image/jpeg,image/png",
            clickable: true,

            uploadprogress: function(progress, percent) {
                
                if ((percent > 1) && (percent < 100)){
                    $('.loading-bar span').css('width', percent.toFixed() + "%");
                }else if (percent >= 100){
                    $('.loading-bar span').css('width', "100%");
                    $('#upload-busy').fadeIn();
                }
            },

            success: function (file, images) {
                
                $('#upload-busy').hide();
                if(!images) {
                    $('#size-warning').fadeIn();
                    $('#upload-drop').addClass('error');
                }
                else {
                        
                    $('#upload-drop').removeClass('error');
                    $('#size-warning').fadeOut();
                    $('#thumbnail-path').html(images.detail_image);

                    // Display the uploaded image back to the user.
                    $('#detail-preview').css('background-image', "url(" + images.detail_image +")");
                    $('#shirt-preview').css('background-image', "url(" + images.shirt_image +")");

                    $('.if-image-uploaded').fadeIn();
                }
            },
            error: function (file, response) {
                $('#upload-busy').hide();
                console.log('Upload error ' + response);
            }
        });

        // Include the user e-mail in the thumnail upload request.
        var dz = Dropzone.forElement('#upload-drop');
        dz.on('sending', function(file, xhr, formData) {
            formData.append('email', $('#email').val());
        });

        // Send the submission request to the backend.
        $("#submission-form").submit(function(e) {
            e.preventDefault();

            var keywords = $('#keywords').val();
            var thumbnail = $('#thumbnail-path').html();

            if(!RIPT.utils.checkRequiredFields())
                return;

            if(thumbnail.length == 0) {
                $('#upload-drop').addClass('missing-input');
                $('body').scrollTop($('#upload-drop').offset().top - 200);
            }
            
            // Make sure TAC was checked.
            if(!$('#accept-tac').prop('checked')) {
                $('.tac-link').addClass('missing-input');
            }

            // Don't continue if there are any missing fields.
            if($('.missing-input').length > 0)
                return;

            var formData = new FormData($(this)[0]);
            formData.append('queue', $('#submission-queue').val());

            RIPT.utils.asyncPost(
                RIPT.settings.apiUrl + 'shopify/submissions2',
                formData,
                function(response) {
                    // Show the success page.
                    $('#artist-form').hide();
                    $('#artist-success').fadeIn(200);
                    $('body').scrollTop(0);
                },
                function(response) {
                }
            );
        });

        // Show/hide the previous location field.
        $('#previous-check').on('click', function() {
            $('.previous-location').toggle();
        });
    }

    function init() {

        loadData();
        bindEvents();
    }

    return {
        init: init
    };

})(RIPT, jQuery);