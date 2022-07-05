
let no = $('#noticeNo').val(); console.log(no + 'noticeNo를 변수에 담음')
function deleteNotice() {
    console.log('딜리트노티스 함수실행')
    $.ajax({
        url: "/deleteNotice",
        type: "POST",
        data: {
            noticeNo: no
        },
        success: function(data) {
            if (data ==='delteSuccess') alert('공지사항 삭제 성공');
            
        }
    })
}



const accordion = document.getElementsByClassName('container');
            
for (i=0; i<accordion.length; i++) {
    accordion[i].addEventListener('click', function () {
        this.classList.toggle('active')
    })
}