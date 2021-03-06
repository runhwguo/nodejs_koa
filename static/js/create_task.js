$(() => {
  const $form          = $('form'),
        $submitBtnWord = $('button.ladda-label'),
        $taskType      = $('#taskType'),
        $rewardType    = $('#rewardType'),
        $btnCaret      = $('#btnCaret'),
        $shareCount    = $('#shareCount'),
        $shareCountDiv = $('#shareCountDiv'),
        $reward        = $('#reward');

  const REWARD_REG = /^\d+(.\d{1,2})?$/;

  const formBootstrapValidator = name => {
    $form.data('bootstrapValidator')
      .updateStatus(name, 'NOT_VALIDATED', null)
      .validateField(name);
  };

  mobiscroll.settings = {
    lang: 'zh',
    display: 'bottom'
  };
  const nowDay        = new Date,
        maxDay        = new Date;

  maxDay.setDate(maxDay.getDate() + 30);

  mobiscroll.date('#deadline', {
    dateFormat: 'yy-mm-dd',
    min: nowDay,
    max: maxDay,
    onClose: () => {
      formBootstrapValidator('deadline');
    }
  });

  mobiscroll.select('#taskType', {
    onClose: event => {
      if (event.valueText) {
        $shareCountDiv[event.valueText === '会员共享' ? 'show' : 'hide']('fast');
        formBootstrapValidator('taskTypeDummy');
      }
    }
  });
  const rewardTypeMbscInst = mobiscroll.select('#rewardType', {
    onClose: event => {
      if (event.valueText) {
        $(`#${$rewardType.attr('id')}_dummy`).attr('width', '10%');
        formBootstrapValidator('rewardTypeDummy');
      }
    }
  });

  // MobiScroll 处理
  const $taskTypeDummy   = $(`#${$taskType.attr('id')}_dummy`),
        $rewardTypeDummy = $(`#${$rewardType.attr('id')}_dummy`);

  $taskTypeDummy.attr('name', 'taskTypeDummy');
  $rewardTypeDummy.attr('name', 'rewardTypeDummy');

  $shareCountDiv[$taskTypeDummy.val() === '会员共享' ? 'show' : 'hide']('fast');

  $btnCaret.click(() => {
    rewardTypeMbscInst.show();
  });

  // MobiScroll 采用bootstrap风格
  $taskTypeDummy.attr('class', 'form-control');
  $rewardTypeDummy.css({
    width: '20%'
  });

  $shareCount.keypress(event => {
    const which = event.which;
    // 127 in ascii is DEL
    if (isDecimalDigit(which) || isDelOrBackspace(which)) {
      if (isDecimalDigit(which)) {
        const val = $shareCount.val();
        if (val.length >= 2) {
          event.preventDefault();
        }
      }
    } else {
      event.preventDefault();
    }
  });

  $reward.keypress(event => {
    const which = event.which;
    // 127 in ascii is DEL
    if (isDecimalDigit(which) || isDelOrBackspace(which) || isDot(which)) {
      if (!isDelOrBackspace(which)) {
        const val = $reward.val();

        if (val.length >= 5) {
          event.preventDefault();
        } else if (val.length === 0 && isDot(which)) {
          event.preventDefault();
        } else if (val.length > 0 && val.include('.')) {
          event.preventDefault();
        }
      }
    } else {
      event.preventDefault();
    }
  });

  $form.bootstrapValidator({
    message: 'The form is not valid',
    feedbackIcons: {
      valid: 'glyphicon glyphicon-ok',
      invalid: 'glyphicon glyphicon-remove',
      validating: 'glyphicon glyphicon-refresh'
    },
    fields: {
      taskTypeDummy: {
        validators: {
          callback: {
            message: '请选择任务类型',
            callback: value => {
              if (value === $taskType.attr('title')) {
                return {
                  valid: false
                };
              }

              return true;
            }
          }
        }
      },
      shareCount: {
        validators: {
          notEmpty: {
            message: '请填写共享次数'
          }
        }
      },
      title: {
        validators: {
          notEmpty: {
            message: '请填入任务标题'
          }
        }
      },
      reward: {
        validators: {
          notEmpty: {
            message: '请填写报酬'
          },
          regexp: {
            regexp: REWARD_REG,
            message: '请输入带1-2位小数的正数'
          },
          callback: {
            callback: value => {
              const reward = Number.parseFloat(value);
              if (reward > 0 && reward < 1.5) {
                return {
                  valid: false,
                  message: '金额最少￥1.5'
                };
              }

              return true;
            }
          }
        }
      },
      deadline: {
        validators: {
          notEmpty: {
            message: '请选择结束日期'
          }
        }
      },
      rewardTypeDummy: {
        validators: {
          callback: {
            message: '请选择付费类型',
            callback: value => {
              if (value === $rewardType.attr('title')) {
                return {
                  valid: false
                };
              }

              return true;
            }
          }
        }
      }
    }
  }).on('success.form.bv', e => {
    e.preventDefault();

    $('#publishOkBtn').click(() => {
      if ($('.modal-body').text().includes('成功')) {
        window.location.href = '/';
      } else {
        $('#publishModal').modal('hide');
      }
    });

    const doSubmit = outTradeNo => {
      const submit         = $('button.submit'),
            loading        = Ladda.create(submit.get(0)),
            serializeArray = $form.serializeArray(),
            data           = {};
      loading.start();

      $.map(serializeArray, (n, i) => data[n['name']] = n['value'].replace(/"/g, '\\"'));
      if (outTradeNo) {
        data.outTradeNo = outTradeNo;
      } else {// 收
        data.reward = -data.reward;
      }
      // 适配服务器 服务器区分收取/打赏依靠正负号 dummy是mobiscroll搞出来的
      data.type = data.taskType;

      delete data.rewardType;
      delete data.rewardTypeDummy;
      delete data.taskType;
      delete data.taskTypeDummy;


      const INTERVAL            = 1000,
            normalSubmitBtnWord = $submitBtnWord.text();
      $.ajaxFileUpload({
        type: $form.attr('method'),
        url: $form.attr('action'),
        secureuri: false,
        fileElementId: 'file',
        data: data,
        dataType: 'json',
        success: (data, status) => {
          console.log(data, status);
          $submitBtnWord.text('成功');
          setTimeout(() => {
            $submitBtnWord.text(normalSubmitBtnWord);
            $('.modal-body').text('任务发布成功，跳回主页？');
            $('#publishModal').modal('show');
            loading.stop();
            // bootstrapValidator本身有prevent double click的逻辑，但是和Ladda有互相影响，手动加一下
            submit.attr('disabled', true);
          }, INTERVAL);
        },
        error: (xhr, status, e) => {
          $submitBtnWord.text('失败');
          setTimeout(() => {
            $submitBtnWord.text(normalSubmitBtnWord);
            $('.modal-body').text('任务发布失败');
            $('#publishModal').modal('show');
            loading.stop();
          }, INTERVAL);
        }
      });
    };

    const reward = Number.parseFloat($('#reward').val());
    if ($rewardTypeDummy.val() === '打赏' && reward > 0) {
      const outTradeNo = randomString(28);
      startPay({fee: reward, body: '发布任务预支付费用', outTradeNo: outTradeNo}, () => {
        doSubmit(outTradeNo);
      }, () => {
      });
    } else {
      doSubmit();
    }
  });
  $('#createTaskTab').attr('href', 'javascript:void(0)');
  $('li[name="rewardValue"]').click(() => {
    $('#rewardType').val($(this).text());

    formBootstrapValidator('rewardType');
  });

  $.uploadPreview({
    input_field: '#file',   // Default: .file
    preview_box: '#image-preview',  // Default: .image-preview
    label_field: '#image-label',    // Default: .image-label
    label_default: '图片补充',   // Default: Choose File
    label_selected: '更换图片',  // Default: Change File
    no_label: false                 // Default: false
  });
  $form.css('margin-bottom', 15 + $('.navbar-fixed-bottom').height());
});