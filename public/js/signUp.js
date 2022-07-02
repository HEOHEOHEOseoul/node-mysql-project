function checkPW(){
    var id = $('#id').val();
    var pw = $('#password').val();
    var cpw = $('#password_a').val();
    var name = $('#name').val();
    var birth = $('#birth').val();
    var phoneNum = $('#phoneNum').val();
    
    if(id.length<4 || id.length >=20) alret("ID의 길이는 4~20자 입니다.");
    else if(pw.length<4 || cpw.length<4) alert("4자리 이상의 암호를 사용해 주세요.");
    else if(pw!==cpw) alert("비밀번호가 일치하지 않습니다.");
    else {
        $.ajax({
            url: "/signUp",
            type: "POST",
            data: {
                id: id,
                pw: pw,
                name: name,
                birth: birth,
                phoneNum: phoneNum
            },
            success: function(data) {
                if (data === "alreadyHasId") {
                    alert("이미 존재하는 ID 입니다.");
                }else if(data === "registDone") {
                    alert("정상적으로 회원가입이 되었습니다.");
                    window.location="/login";
                }
            }
        })
    }
}