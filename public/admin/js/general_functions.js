function checkInputValidate(inputElements) {
    let result=true;
    inputElements.forEach(function (element) {
        let required=$(element).attr('required');
        if(typeof required !== typeof undefined && required!==false){
            if($(element).val()==''){
                $(element).closest('div').find('.invalid-feedback').slideDown('slow');
                result=false;
            }
        }
    });
    return result;
}

function checkSingleSelectValidate(selectElements) {
    let result=true;
    let i=0;
    selectElements.forEach(function (element) {
        if(parseInt($(element).val())<=0 || $(element).val()===null){
            $(element).closest('div').find('.invalid-feedback').slideDown('slow');
            result=false;
        }
        i++;
    })
    return result;
}

function selectMultipleElement(selectMultipleElements) {
    let result=true;
    if(selectMultipleElements.length!=0)
    {
        selectMultipleElements.forEach(function(element){
            if($(element).val().length==0){
                $(element).closest('div').find('.invalid-feedback').slideDown('slow');
                result=false;
            }
        })
    }
    return result;
}

function checkValidate(inputElements,selectElements,selectMultipleElements=[]) {
    let result1=checkInputValidate(inputElements);
    let result2=checkSingleSelectValidate(selectElements);
    let result3=selectMultipleElement(selectMultipleElements);
    return result1 && result2 && result3;
}

$('input').keyup(function () {
    if($(this).val()!='')
        removeErrorSpan(this);
});

$('select').change(function () {
    let value=$(this).val();
    let multiple=$(this).attr('multiple');
    if(typeof multiple !== typeof undefined && multiple!==false)
        if(value.length>0)
            removeErrorSpan(this);
    else
        if((value!==null && value!=-1))
            removeErrorSpan(this);
})


function removeErrorSpan(element) {
    $(element).closest('div').find('.invalid-feedback').slideUp('slow');
}


function readURL(input,image_preview_id) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            $(`#${image_preview_id}`).attr('src', e.target.result);
        }
        reader.readAsDataURL(input.files[0]);
    }
}


function showLoader(){
    $('.loader-container').removeClass('hidden');
    $('body').css({'overflow':'hidden'});
}

function hideLoader() {
    $('.loader-container').addClass('hidden');
    $('body').css({'overflow':'auto'});

}
