<?php
include_once '../config.php';

$init_options = file_get_contents('./question_editor_init_options.json');

$request = '
{
  "config": {
    "dependencies": {
      "question_editor_api": {
        "init_options": '.$init_options.'
      }
    }
  }
}
';
$signedRequest = signAuthoringRequest(json_decode($request, true));

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Author API - Skeleton</title>
    <script src="//authorapi.learnosity.com"></script>
    <style>
        <?php echo(file_get_contents('../sharedStyle.css')); ?>

/* CSS styles for the custom response placholder */
.custom-response-placeholder {
    margin: 0 0.5rem;
    background: #eee;
    color: #777;
    padding: 0.25rem;
    border-radius: 0.25rem;
    .response-number {
        padding: 0.25rem;
        color: white;
        background: #777;
        margin-right: 0.25rem;
        margin-left: -0.25rem;
        border-radius: 0.25rem 0 0 0.25rem;
    }
}

    </style>
</head>
<body>
<div id="learnosity-author"></div>
<div>
    <div class="client-request-json" data-type="initOptions">
        <div><b>Request init options</b></div>
        <textarea readonly></textarea>
    </div>
    <div class="client-request-json" data-type="htmlLayout">
        <div><b>Custom Question HTML Layout</b></div>
        <textarea readonly></textarea>
    </div>
</div>

<script>
    window.activity = <?php echo $signedRequest; ?>;

    window.authorApp = LearnosityAuthor.init(activity, {
        readyListener() {
            console.log('The Author API is ready');
            /** Navigate directly to the tile view */
            authorApp.navigate('items/new/widgets/new')
            // utility fucntion to check if an array of numbers is sequential or not.
            function isSequential(array) {
                let sequential = true;
                array.forEach((number, index) => {
                    if (number !== index + 1) {
                        sequential = false;
                        return;
                    }
                })
                return sequential;
            }

            authorApp.on("widgetedit:preview:changed", () => {

                const templateTextAreaEl = document.querySelector(`div[data-lrn-qe-input-path="template"] .cke_textarea_inline`);
                const responseNumbersElements = Array.from(templateTextAreaEl.querySelectorAll('span.response-number'));
                const responseNumbersArray = responseNumbersElements.map(el => Number(el.innerText));
                if(!isSequential(responseNumbersArray)) {
                    // update the response numbers elements with the resulting sequential numbers
                    responseNumbersElements.forEach((el,index) => { 
                        el.innerText = index+1;
                    })
                }
            }) 
        },
        customButtons: [{
            name: 'custom_insert_response_button',
            label: 'Custom Insert Response',
            icon: '/letter-r-svgrepo-com.svg',
            func: function customInsertResponse(attribute, callback) {
  
                const templateTextAreaEl = document.querySelector(`div[data-lrn-qe-input-path="template"] .cke_textarea_inline`);
                const lastResponseNumber = Array.from(templateTextAreaEl.querySelectorAll('span.response-number'))?.pop()?.innerHTML || 0
                nextResponseNumber = Number(lastResponseNumber) + 1;
                return callback(
                        `<span class="custom-response-placeholder" contenteditable="false"><span class="response-number">${nextResponseNumber}</span>Response</span>`
                    )
            },
            attributes: [
                "template"
            ]
        }],
        errorListener(e) {
            console.error(e); 
        },
    });

    // Display the current request init options & html layout
    document.querySelector('[data-type="initOptions"] > textarea').value = `${JSON.stringify(window.activity, null, 2)}`;
    document.querySelector('[data-type="htmlLayout"] > textarea').value = `<?php echo (file_get_contents('dist/authoring_custom_layout.html')) ?>`;
</script>
</body>
</html>
