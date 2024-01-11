   // 全局变量
var currentPage = 1;
var resultsPerPage = 10; // DataTables将管理每页的结果数量
var data; // 保存查询结果数据
var totalRecords = 0; // 初始为0
// let selectedColumnsString; // 保存所选列的字符串
let datatableColumnSettings; // 保存表格列设置的字符串
let table; // 保存表格对象
let columnVisibilityStates = [];

// // 假設你的表格元素 ID 為 'example'
// if ($.fn.dataTable.isDataTable('#outputTable')) {
//     table.on('column-visibility.dt', function(e, settings, column, state) {
//         // 處理列顯示/隱藏的改變
//     });
// } else {
//     // DataTable 尚未初始化
//     // 這裡可以進行 DataTable 的初始化，或其他處理
// }

$(document).ready(function(){
    // 初始化 Select2 下拉菜单
    $('#taskIdSelect, #projectSelect, #phaseSelect, #categorySelect, #caseTitleSelect').select2({ width: 'resolve' });
    // 绑定清除所有按钮的点击事件
    $('#clearAllButton').click(clearAll);
    // 初始化表格
    $('#outputTable thead tr:eq(1) th').each(function(i) {
        $('input', this).on('keyup change', function() {
            if (table.column(i).search() !== this.value) {
                table.column(i).search(this.value).draw();
            }
        });
    });
    $.ajax({
        url: '/get-dropdown-data',
        type: 'GET',
        success: function(data) {
            // 更新 Task ID 下拉菜单
            var taskIdSelect = $('#taskIdSelect');
            data.taskIds.forEach(function(taskid) {
                taskIdSelect.append($('<option>', { value: taskid, text: taskid }));
            });

            // 更新 Platform Name 下拉菜单
            var projectSelect = $('#projectSelect');
            data.platformNames.forEach(function(name) {
                projectSelect.append($('<option>', { value: name, text: name }));
            });

            // 更新 HW Phase 下拉菜单
            var phaseSelect = $('#phaseSelect');
            data.hwPhases.forEach(function(phase) {
                phaseSelect.append($('<option>', { value: phase, text: phase }));
            });

            // 更新 Category 下拉菜单
            var categorySelect = $('#categorySelect');
            data.categories.forEach(function(category) {
                categorySelect.append($('<option>', { value: category, text: category }));
            });

            // 更新 Case Title 下拉菜单
            var caseTitleSelect = $('#caseTitleSelect');
            data.caseTitles.forEach(function(title) {
                caseTitleSelect.append($('<option>', { value: title, text: title }));
            });

        },
        error: function(error) {
            console.error("Error loading dropdown data: ", error);
        }
    });
    //initializeDataTable();
    executeQuery(); // 在页面加载时执行一次查询以填充数据
});

// $(document).ready(function() {
//     $('.js-example-basic-multiple').select2({
//         placeholder: "Select Columns",
//         allowClear: true,
//         width: '100%',
//         closeOnSelect: false
//     });
//     $('.js-example-basic-multiple').on('change', function() {
//         var selectedColumnsValues = $(this).val(); // 獲取選中的所有值

//         // 將選中的值轉換成所需格式的字串
//         selectedColumnsString = selectedColumnsValues.map(function(value, index) {
//             return "`" + value + "`";
//         }).join(", ");

//         // console.log(selectedColumnsString);
//     });
// });

// $(document).on('DOMNodeRemoved', function(e) {
//     if ($(e.target).hasClass('dt-button-collection')) {
//         // dt-button-collection 被移除，執行 executeQuery
//         executeQuery();
//     }
// });

// 創建 MutationObserver 的實例，指定回調函數
var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        // 檢查被移除的節點列表
        if (mutation.removedNodes) {
            mutation.removedNodes.forEach(function(removedNode) {
                // 檢查是否是我們關心的元素
                if ($(removedNode).hasClass('dt-button-collection')) {
                    // dt-button-collection 被移除，執行 executeQuery
                    captureColumnSettings(table);
                     executeQuery();
                     table.on('column-visibility.dt', function(e, settings, column, state) {
                         var columnVisibility = table.columns().visible().toArray();
                         localStorage.setItem('datatableColumnVisibility', JSON.stringify(columnVisibility));
                     });
                     table.on('column-visibility.dt', function(e, settings, columnIdx, visible) {
                         visibleColumns = table.columns().visible().toArray();
                     });
                }
            });
        }
    });
});

// 指定監聽配置
var config = { childList: true, subtree: true };

// 開始監聽 document.body 的變化
observer.observe(document.body, config);

function captureColumnSettings(table) {
    let columnSettings = table.columns().eq(0).map(function(index) {
        let column = table.column(index);
        return {
            visible: column.visible(),
            className: $(column.header()).attr('class'),
            width: $(column.header()).css('width')
        };
    }).toArray();
    //datatableColumnSettings = JSON.stringify(columnSettings)
    localStorage.setItem('datatableColumnSettings', JSON.stringify(columnSettings));
}

function getVisibleColumnsAsString() {
    var visibleColumns = table.columns(':visible').header().toArray().map(function(header) {
        return '`' + $(header).text() + '`';
    });
    
    return visibleColumns.join(', ');
}

function executeQuery() {
    var taskId = document.getElementById("taskIdSelect").value;
    var project = document.getElementById("projectSelect").value;
    var caseTitle = document.getElementById("caseTitleSelect").value;
    var phase = document.getElementById("phaseSelect").value;
    var category = document.getElementById("categorySelect").value;
    var highRiskCheckbox = document.getElementById("highRiskCheckbox");

    // if (typeof table === 'undefined') {
    //     selectedColumnsString = "`ID`, `Task ID`, `Case Title`, `Pass/Fail`, `Testing Site`, `Tester`, `Platform Name`, `SKU`, `Hw Phase`, `OBS`, `Block Type`, `File`, `KAT/KUT`, `RTA`, `ATT/UAT`, `Run Cycle`, `Fail Cycle/Total Cycle`, `Category`, `Case Note`, `Comments`, `Component List`, `Comment`";
    // } else {
    //     selectedColumnsString = getVisibleColumnsAsString();
    // }

    // 不管表格是否已初始化，都需要重新设置列
    selectedColumnsString = "`ID`, `Task ID`, `Case Title`, `Pass/Fail`, `Testing Site`, `Tester`, `Platform Name`, `SKU`, `Hw Phase`, `OBS`, `Block Type`, `File`, `KAT/KUT`, `RTA`, `ATT/UAT`, `Run Cycle`, `Fail Cycle/Total Cycle`, `Category`, `Case Note`, `Comments`, `Component List`, `Comment`";

    // 构建 SQL 查询
    var sqlQuery = `SELECT ${selectedColumnsString} FROM abc
    WHERE (\`Platform Name\` = '${project}' OR '${project}' = '')
    AND (\`Case Title\` = '${caseTitle}' OR '${caseTitle}' = '')
    AND (\`HW Phase\` = '${phase}' OR '${phase}' = '')
    AND (\`Category\` REGEXP '^[[:space:]]*${category}[[:space:]]*$' OR '${category}' = '')`;

    // 如果复选框被选中，则添加条件
    if (highRiskCheckbox.checked) {
        sqlQuery += ` AND (\`OBS\` != '')`;
    }


    // 发送查询请求
    fetch('/execute_query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({query: sqlQuery}),
    })
    .then(response => response.json())
    .then(responseData => {
        if (!responseData || responseData.length === 0) {
            console.error("Response data is not defined or is empty.");
            return;
        }
        data = responseData.result; // 使用responseData的result属性
        totalRecords = data.length; // 设置totalRecords为数组长度
        console.log("Total records:", totalRecords);
        console.log("Data:", data); // 查看数据结构
        initializeDataTable(); // 确保数据加载后调用
    })
    .catch((error) => {
        console.error('Error:', error);
    });

}

function initializeDataTable() {
    // $.fn.dataTable.ext.errMode = 'none'; // 隐藏 DataTables 的错误提示
    let savedSettings = localStorage.getItem('datatableColumnSettings');
    //let savedSettings = datatableColumnSettings
    let columnSettings = savedSettings ? JSON.parse(savedSettings) : [];
    table = $('#outputTable').DataTable({
        "destroy": true, // 允许重新初始化
        "data": data,
        // "columns": data.list_columns,
        // "fixedHeader":{
        //     header: true,
        //     headerOffset: -6
        // }, 
        "processing" : true,
        "columns": [
            { "data": 0, "width": "1%"}, // 對應 "ID"
            { "data": 1, "width": "3%"}, // 對應 "Task ID"
            { "data": 2, "width": "40%"}, // 對應 "Case Title"
            { "data": 3, "width": "1%"}, // 對應 "Pass/Fail"
            { "data": 4, "width": "1.7%"}, // 對應 "Testing Site"
            { "data": 5, "width": "1%"}, // 對應 "Tester"
            { "data": 6, "width": "1.2%"}, // 對應 "Platform Name"
            { "data": 7, "width": "1.3%" }, // 對應 "SKU"
            { "data": 8, "width": "1.5%" }, // 對應 "Hw Phase"
            { "data": 9,
            "className": 'redirect-cell',
            "render": function(data, type, row) {
                // 檢查數據是否為 null
                if (data !== null && data !== '') {
                    // 數據非 null，生成鏈接
                    var url = 'https://si.austin.hp.com/si/Observations/Details.aspx?offset=8&ObservationId=' + data;
                    return '<a href="' + url + '" class="clickable" target="_blank">' + data + '</a>';
                } else {
                    // 數據為 null，不生成鏈接
                    return data;
                }
            },
            "width": "0.8%"
            }, // 對應 "OBS"
            { "data": 10, "width": "1%" }, // 對應 "Block Type"
            { "data": 11, "width": "1.5%" }, // 對應 "File"
            { "data": 12, "width": "1%" }, // 對應 "KAT/KUT"
            { "data": 13, "width": "1%" }, // 對應 "RTA"
            { "data": 14, "width": "1%" }, // 對應 "ATT/UAT"
            { "data": 15, "width": "1%" }, // 對應 "Run Cycle"
            { "data": 16, "width": "5%" }, // 對應 "Fail Cycle/Total Cycle"
            { "data": 17, "width": "1%" }, // 對應 "Category"
            { "data": 18, "width": "1%" }, // 對應 "Case Note"
            { "data": 19,
            "className": 'ellipsis-cell', 
            "render": function(data, type, row) {
                if (data !== null && data !== '') {
                    // 數據非 null 或非空，添加 'has-data' 類
                    return '<span class="has-data">' + data + '</span>';
                } else {
                    // 數據為 null 或空，不添加 'has-data' 類
                    return data;
                }
            },
            "width": "2%"}, // 對應 "Comments"
            { "data": 20,
            "className": 'ellipsis-cell', 
            "render": function(data, type, row) {
                if (data !== null && data !== '') {
                    // 數據非 null 或非空，添加 'has-data' 類
                    return '<span class="has-data">' + data + '</span>';
                } else {
                    // 數據為 null 或空，不添加 'has-data' 類
                    return data;
                }
            },
            "width": "2%"}, // 對應 "Component List"
            { "data": 21,
            "className": 'ellipsis-cell',"render": function(data, type, row) {
                if (data !== null && data !== '') {
                    // 數據非 null 或非空，添加 'has-data' 類
                    return '<span class="has-data">' + data + '</span>';
                } else {
                    // 數據為 null 或空，不添加 'has-data' 類
                    return data;
                }
            },
            "width": "2%"}, // 對應 "Comment"
        ],
        "paging": true, // 启用分页
        "pagingType": "simple_numbers",
        "info": true, // 显示页码信息
        "searching": true, // 启用搜索
        "ordering": true, // 启用排序
        "language": {
            "lengthMenu": "Show _MENU_ items",
            "info": "Showing _START_ to _END_ of _TOTAL_ items"
        },
        "scrollX": true,
        "scrollY": "500px",
        "dom": 
            '<"top"Bf>' +
            'rt' +
            '<"bottom"<"row"<"col-md-10"i><"col-md-1"l>>>' +
            '<"row"<"col-12"p>>' +
            '<"clear">',
        "buttons": [
            {
                extend: 'colvis',
                text: 'Display Columns',
                columns: ':not(.noVis)',
                className: 'colvis-btn',
                collectionLayout: 'fixed columns',
                collectionTitle: 'Display Columns'
            },
            {
                extend: 'excelHtml5',
                className: 'custom-excel-button',
                text: 'Excel',
                exportOptions: {
                   columns: ':visible'
               },
                action: function (e, dt, button, config) {
                    var today = new Date();
                    var formattedDate = today.getFullYear() + '-' + (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');
                    var defaultFileName = "Test Case Prioritization-" + formattedDate;
            
                    swal({
                        title: "Enter file name",
                        text: "Please enter a name for the Excel file:",
                        content: {
                            element: "input",
                            attributes: {
                                value: defaultFileName,
                            },
                        },
                        buttons: ["Cancel", "Export"],
                        closeOnClickOutside: true 
                    }).then((value) => {
                        if (value !== null) { // 检查用户是否点击了按钮
                            config.filename = value ? value : defaultFileName; // 使用用户输入或默认文件名
                            // 调用原本的 action 函数来执行导出
                            $.fn.dataTable.ext.buttons.excelHtml5.action.call(this, e, dt, button, config);
                        }
                    });
                }
             }
        ],
        "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]], // 指定每頁顯示數量的選項
        "pageLength": 10, // 初始的每頁顯示數量
        "initComplete": function(settings, json) {
            // 應用保存的列設定
            this.api().columns().every(function(index) {
                let column = this;
                let settings = columnSettings[index] || {};
                column.visible(settings.visible, false);
                $(column.header()).addClass(settings.className);
                $(column.header()).css('width', settings.width);
            });
            this.api().columns.adjust().draw(false);
        }
    });
    $('#outputTable tbody').on('click', 'td.ellipsis-cell', function() {
        var cellData = table.cell(this).data();
        // 打開 Modal 並顯示文字columnDefs
        if (cellData !== null && cellData !== '') {
            $('#exampleModal .modal-body').text(cellData);
            $('#exampleModal').modal('show');
        }
    }); 

    // $('#outputTable tbody').on('click', 'td.redirect-cell', function() {
    //     var cellData = $(this).text(); // 或者獲取單元格中的任何數據來決定網址
    //     var url = 'https://si.austin.hp.com/si/Observations/Details.aspx?offset=8&ObservationId=' + cellData; // 構造 URL
    
    //     window.open(url, '_blank'); // 重定向到該 URL
    // });
}



function clearAll() {
    // 移除 onchange 事件處理器 
    $('#taskIdSelect').attr('onchange', '');
    $('#projectSelect').attr('onchange', '');
    $('#phaseSelect').attr('onchange', '');
    $('#categorySelect').attr('onchange', '');
    $('#caseTitleSelect').attr('onchange', '');
    // 重置下拉式菜单
    $('#taskIdSelect').val('').trigger('change');
    $('#projectSelect').val('').trigger('change');
    $('#phaseSelect').val('').trigger('change');
    $('#categorySelect').val('').trigger('change');
    $('#caseTitleSelect').val('').trigger('change');
    // 重新綁定 onchange 事件處理器
    $('#taskIdSelect').attr('onchange', 'executeQuery()');
    $('#projectSelect').attr('onchange', 'executeQuery()');
    $('#phaseSelect').attr('onchange', 'executeQuery()');
    $('#categorySelect').attr('onchange', 'executeQuery()');
    $('#caseTitleSelect').attr('onchange', 'executeQuery()');

    // 移除 onchange 事件處理器
    $('#highRiskCheckbox').attr('onchange', '');
    // 清除复选框
    $('#highRiskCheckbox').prop('checked', false);
    // 重新綁定 onchange 事件處理器
    $('#highRiskCheckbox').attr('onchange', 'executeQuery()');

    // 清除所有保存的列设置
    localStorage.removeItem('datatableColumnSettings');
    //datatableColumnSettings = null;
   
    // 执行查询以更新结果
    executeQuery();
}

$(document).ready(function() {
    
});

