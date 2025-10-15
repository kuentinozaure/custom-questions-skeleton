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
            console.log('ready');
        },
        // custom buttons callback here
        customButtons: [{
            name: 'insertQuestionClickCorrectTemplate',
            icon: "https://questioneditor.learnosity.com/v3.135.1/vendor/ckeditor/plugins/icons.png?t=M2G9",
            label: "Insert Question Click Correct Template",
            func: function customInsertResponse(attribute, callback) {
                var templateHtml = `<div class="search-box">
                            <input type="text" class="search-input" placeholder="Cliquez-moi..." />
                        </div>`;
                return callback(templateHtml);
            },
            // attributes: [
            //     "custom_question_click_correct_template"
            // ]
        }],
        // end cusom buttons callback
        errorListener(e) {
            console.error(e);
        },
    });


    console.log(window.activity);
    // Display the current request init options & html layout
    document.querySelector('[data-type="initOptions"] > textarea').value = `${JSON.stringify(window.activity, null, 2)}`;
    document.querySelector('[data-type="htmlLayout"] > textarea').value = `<?php echo (file_get_contents('dist/authoring_custom_layout.html')) ?>`;
</script>
</body>
</html>
