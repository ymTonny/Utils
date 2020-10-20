class SearchPage {
  /** 高亮显示数组 */
  highlights = [];
  /** 当前突出显示的查找内容 */
  find_outstand = -1;
  /** 查找的文本 */
  find_text = "";
  /** 是否自定义高亮css  0=不 */
  highlight_rule = false;
  /** 是否自定义突出高亮css */
  outstand_rule = false;
  constructor() {
    this.createFindDiv();
  }
  createFindDiv() {
    const find_div = document.createElement("div");
    const find_div_css = `display:flex;justify-content:space-around;align-items:center;width:340px;height:50px;padding: 10px 20px;box-sizing: border-box;
      box-shadow: 0 0 10px rgba(128,145,165,0.3);position:fixed;top:30px;right:-340px;z-index:2000;background:#fff;`;
    const btn_css =
      "background:transparent;border:none;outline:none;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;";
    const input_css = "border:none;outline:none;height:100%;";
    this.addCss(`.ymTonny_find_btn {${btn_css}}`);
    this.addCss(`.ymTonny_find_btn:hover {background:#e8e8e8}`);
    this.addCss(`.ymTonny_find_search {${input_css}}`);

    find_div.id = "search_root_div";
    find_div.className = "search_root_div";
    find_div.classList.add("search_root_in");
    this.addCss(`.search_root_div {${find_div_css}}`);
    document.body.appendChild(find_div);

    const find_html = `<div style="height:100%;border-right:1px solid #d6d6d6;position:relative;padding-right:15px;">
                        <input type="search" class="ymTonny_find_search" placeholder="请输入关键词" id="ymTonny_find_text"/>
                        <span id="search_find_msg" style="font-size:13px"></span>
                      </div>
                      <button id="ymTonny_find_prev" class="ymTonny_find_btn" title="上一个">&#9650;</button>
                      <button id="ymTonny_find_next" class="ymTonny_find_btn" title="下一步">&#9660;</button>
                      <button class="ymTonny_find_btn" id="ymTonny_find_btn" title="关闭">X</button>`;
    find_div.innerHTML = find_html;
    setTimeout(() => {
      this.addCss(`.search_root_in {right:30px;transition:all 0.5s linear}`);
      this.addCss(
        ".ymTonny_close_search {right:-340px;transition:all 0.5s linear}"
      );
    }, 500);

    // 绑定事件
    const inputBox = document.getElementById("ymTonny_find_text");
    const closeBox = document.getElementById("ymTonny_find_btn");
    const prevBox = document.getElementById("ymTonny_find_prev");
    const nextBox = document.getElementById("ymTonny_find_next");
    inputBox.onchange = this.resetText.bind(this);
    closeBox.onclick = this.findKeyDown.bind(this);
    prevBox.onclick = this.findPrev.bind(this);
    nextBox.onclick = this.findEdit.bind(this);

    // 自定义高亮与当前突出高亮样式
    const sheets = document.styleSheets;
    for (let i = 0; i < sheets.length; i++) {
      try {
        const rules = sheets[i].rules ? sheets[i].rules : sheets[i].cssRules;
        if (rules != null)
          for (var j = 0; j < rules.length; j++) {
            if (rules[j].selectorText == ".ymTonny_highlight")
              this.highlight_rule = true;
            else if (rules[j].selectorText == ".ymTonny_findselected")
              this.outstand_rule = true;
          }
      } catch (error) {
        console.error("Caught Firefox CSS loading error: " + error);
      }
    }

    // 初始化keydown键盘事件
    this.findKeyDown();
  }
  findKeyDown(e) {
    const inputBox = document.getElementById("ymTonny_find_text");
    const rootBox = document.getElementById("search_root_div");
    if (!e) {
      if (document.addEventListener)
        // Chrome, Firfox, IE9+, Safari
        document.addEventListener("keydown", this.checkKey, false);
      // IE<9
      else document.attachEvent("onkeydown", this.checkKey);
      // 光标定位search框
      inputBox.focus();
      inputBox.select();
    } else {
      // 移除关闭class;
      rootBox.classList.add("ymTonny_close_search");
      setTimeout(() => {
        rootBox.classList.remove("search_root_in", "ymTonny_close_search");
      }, 1000);
      this.sethighLight(); // 移除高亮
      // 移除事件
      if (document.removeEventListener)
        document.removeEventListener("keydown", this.checkKey, false);
      else document.detachEvent("onkeydown", this.checkKey);
    }
  }
  addCss(css) {
    const style = document.createElement("style");
    style.type = "text/css";
    if (style.styleSheet) style.styleSheet.cssText = css;
    else style.appendChild(document.createTextNode(css));

    document.getElementsByTagName("head")[0].appendChild(style);
  }
  resetText() {
    if (
      this.find_text.toLowerCase() !=
      document.getElementById("ymTonny_find_text").value.toLowerCase()
    )
      this.sethighLight();
  }
  sethighLight() {
    for (let i = 0; i < this.highlights.length; i++) {
      const first_text_node = this.highlights[i].firstChild; // 突出显示的文本节点

      const parent_node = this.highlights[i].parentNode; // 高亮显示范围的文本节点

      // 用文本节点替换first_text_node和parent_node
      if (this.highlights[i].parentNode) {
        this.highlights[i].parentNode.replaceChild(
          first_text_node,
          this.highlights[i]
        );
        if (i == this.find_outstand)
          this.selectElementContents(first_text_node);
        parent_node.normalize(); // 删除空的text节点并连接相邻的text节点
        this.normaLize(parent_node); // normalize() IE中可能会留下空text节点
      }
    }

    // 重置数据
    this.highlights = [];
    this.find_outstand = -1;
  }
  highlight(word, node) {
    if (!node) node = document.body;

    for (node = node.firstChild; node; node = node.nextSibling) {
      if (node.nodeType == 3) {
        // 文本节点
        const n = node;
        let match_pos = 0;
        match_pos = n.nodeValue.toLowerCase().indexOf(word.toLowerCase());

        // 匹配成功
        if (match_pos > -1) {
          const before = n.nodeValue.substr(0, match_pos); // 拆分的前部分
          const middle = n.nodeValue.substr(match_pos, word.length); // 匹配保留大小写
          const after = document.createTextNode(
            n.nodeValue.substr(match_pos + word.length)
          ); // 拆分的后部分
          const highlight_span = document.createElement("span"); // 在节点中间创建一个span
          if (this.highlight_rule)
            highlight_span.className = "ymTonny_highlight";
          else highlight_span.style.backgroundColor = "yellow";

          highlight_span.appendChild(document.createTextNode(middle)); // 插入一个新的span节点
          n.nodeValue = before;
          n.parentNode.insertBefore(after, n.nextSibling);
          n.parentNode.insertBefore(highlight_span, n.nextSibling);
          this.highlights.push(highlight_span);
          highlight_span.id = "highlight_span" + this.highlights.length;
          node = node.nextSibling; // 继续到下一个节点
        }
      } // 不是文本节点
      else {
        if (
          node.nodeType == 1 &&
          node.nodeName.match(/textarea|input/i) &&
          node.type.match(/textarea|text|number|search|email|url|tel/i) &&
          !this.getStyle(node, "display").match(/none/i) &&
          node.className != "ymTonny_find_search"
        )
          this.textareaPre(node);
        else {
          if (
            node.nodeType == 1 &&
            !this.getStyle(node, "visibility").match(/hidden/i)
          )
            if (
              node.nodeType == 1 &&
              !this.getStyle(node, "display").match(/none/i)
            )
              // 不搜索display:none visibility 当前search input框
              this.highlight(word, node);
        }
      }
    }
  }
  getStyle(el, Props) {
    const x = document.getElementById(el) ? document.getElementById(el) : el;
    let y;
    if (x.currentStyle) {
      // IE
      y = x.currentStyle[Props];
    } else if (window.getComputedStyle) {
      // Firfox
      y = document.defaultView
        .getComputedStyle(x, null)
        .getPropertyValue(Props);
    }
    return y;
  }
  textareaPre(el) {
    let pre;
    if (el.nextSibling && el.nextSibling.id && el.nextSibling.id.match(/pre_/i))
      pre = el.nextsibling;
    else pre = document.createElement("pre");

    let area_text = el.value; // 所有textarea文本

    // <>替换为实体
    area_text = area_text
      .replace(/>/g, "&gt;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
    pre.innerHTML = area_text;

    // 复制textarea样式到pre
    let completeStyle = "";
    if (typeof getComputedStyle !== "undefined") {
      completeStyle = window.getComputedStyle(el, null).cssText;
      if (completeStyle != "")
        // IE 10 and Firefox
        pre.style.cssText = completeStyle;
      // Chrome
      else {
        // IE 10 and Firefox cssText为空
        const style = window.getComputedStyle(el, null);
        for (let i = 0; i < style.length; i++) {
          completeStyle +=
            style[i] + ": " + style.getPropertyValue(style[i]) + "; ";
        }
        pre.style.cssText = completeStyle;
      }
    } else if (el.currentStyle) {
      // IE
      const elStyle = el.currentStyle;
      for (let k in elStyle) {
        completeStyle += k + ":" + elStyle[k] + ";";
      }
      pre.style.border = "1px solid black"; // 边框在ie中无法复制
    }

    el.parentNode.insertBefore(pre, el.nextSibling); // 在textarea后插入pre

    // textarea区域模糊关闭
    el.onblur = function () {
      this.style.display = "none";
      pre.style.display = "block";
    };
    // textarea发送变化将新值放入pre
    el.onchange = function () {
      pre.innerHTML = el.value
        .replace(/>/g, "&gt;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");
    };

    el.style.display = "none";
    pre.id = "pre_" + this.highlights.length;
    // 关闭pre打开textare, 执行textare事件
    pre.onclick = function () {
      this.style.display = "none";
      el.style.display = "block";
      el.focus();
      el.click();
    };
  }
  normaLize(node) {
    if (!node) {
      return;
    }
    if (node.nodeType == 3) {
      while (node.nextSibling && node.nextSibling.nodeType == 3) {
        node.nodeValue += node.nextSibling.nodeValue;
        node.parentNode.removeChild(node.nextSibling);
      }
    } else {
      this.normaLize(node.firstChild);
    }
    this.normaLize(node.nextSibling);
  }
  findPrev() {
    const search_find_msg = document.getElementById("search_find_msg");
    let current_find;

    if (this.highlights.length < 1) return;

    if (this.find_outstand != -1) {
      current_find = this.highlights[this.find_outstand];

      // 设置高亮颜色
      if (this.highlight_rule) current_find.className = "ymTonny_highlight";
      else current_find.style.backgroundColor = "yellow";
    }

    this.find_outstand--;

    if (this.find_outstand < 0)
      // 如果到起点
      this.find_outstand = this.highlights.length - 1; // 回到最后

    const display_find = this.find_outstand + 1;

    search_find_msg.innerHTML = display_find + " of " + this.highlights.length;

    current_find = this.highlights[this.find_outstand];

    // 设置当前突出选中颜色
    if (this.outstand_rule) current_find.className = "ymTonny_findselected";
    else current_find.style.backgroundColor = "orange";

    // 滚动到突出选中元素
    this.scrollToPosition(this.highlights[this.find_outstand]);
  }
  findNext() {
    let current_find;

    if (this.find_outstand != -1) {
      current_find = this.highlights[this.find_outstand];

      // 设置高亮颜色
      if (this.highlight_rule) current_find.className = "ymTonny_highlight";
      else current_find.style.backgroundColor = "yellow";
    }

    this.find_outstand++;

    if (this.find_outstand >= this.highlights.length)
      // 如果到末尾
      this.find_outstand = 0; // 回到第一个

    const display_find = this.find_outstand + 1;

    search_find_msg.innerHTML = display_find + " of " + this.highlights.length;

    current_find = this.highlights[this.find_outstand];

    // 设置当前突出选中颜色
    if (this.outstand_rule) current_find.className = "ymTonny_findselected";
    else current_find.style.backgroundColor = "orange";

    // 滚动到突出选中元素
    this.scrollToPosition(this.highlights[this.find_outstand]);
  }
  findEdit() {
    const search_find_msg = document.getElementById("search_find_msg");

    // 获取search input框文案
    const inputVal = document.getElementById("ymTonny_find_text").value;

    // search文案未更新并且之前有
    if (
      this.find_text.toLowerCase() ==
        document.getElementById("ymTonny_find_text").value.toLowerCase() &&
      this.find_outstand >= 0
    ) {
      this.findNext();
    } else {
      this.sethighLight(); // 初始化highlights

      if (inputVal == "") {
        // if empty string
        search_find_msg.innerHTML = "";
        return;
      }

      this.find_text = inputVal;
      let node = null;
      if (this.find_root_node != null)
        node = document.getElementById(this.find_root_node);
      else node = null;

      this.highlight(inputVal, node); // 突出显示搜素的字符串

      if (this.highlights.length > 0) {
        this.find_outstand = -1;
        this.findNext(); // 设置第一个当前突出
      } else {
        search_find_msg.innerHTML = "&nbsp;<b></b>";
        this.find_outstand = -1;
      }
    }
  }
  scrollToPosition(field) {
    if (field) {
      if (this.isOnScreen(field) != true) {
        const isSmoothScrollSupported =
          "scrollBehavior" in document.documentElement.style;
        if (isSmoothScrollSupported) {
          field.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else {
          field.scrollIntoView(false);
        }
      }
    }
  }
  isOnScreen(el) {
    /* 检查元素是否在当前窗口中 */
    const screenHeight =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight;
    const screenWidth =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;

    const rect = el.getBoundingClientRect();
    if (
      rect.bottom >= 0 &&
      rect.right >= 0 &&
      rect.top <= screenHeight &&
      rect.left <= screenWidth
    )
      return true;
    else {
      // 计算视窗外值
      const distance = Math.min(
        Math.abs(rect.bottom),
        Math.abs(rect.right),
        Math.abs(rect.top - screenHeight),
        Math.abs(rect.left - screenWidth)
      );

      return -Math.abs(distance);
    }
  }
  checkKey = (e) => {
    let keycode;
    if (window.event)
      // if ie
      keycode = window.event.keyCode;
    // if Firefox or Netscape
    else keycode = e.which;

    if (keycode == 13) {
      // if ENTER key
      if (window.event && event.srcElement.id.match(/ymTonny_find_text/i)) {
        event.srcElement.blur();
        document.getElementById("ymTonny_find_next").focus();
      } // 添加下一步btn焦点
      else if (e && e.target.id.match(/ymTonny_find_text/i)) {
        e.target.blur();
        document.getElementById("ymTonny_find_next").focus();
      }
      if (document.activeElement.className != "ymTonny_find_btn")
        this.findEdit();
    } else if (keycode == 27) {
      // ESC key
      const rootBox = document.getElementById("search_root_div");
      // 移除关闭class;
      rootBox.classList.add("ymTonny_close_search");
      setTimeout(() => {
        rootBox.classList.remove("search_root_in", "ymTonny_close_search");
        document.body.removeChild(rootBox);
      }, 1000);
      this.findKeyDown(true);
    } else if (keycode == 70 && e.ctrlKey) {
      e.preventDefault();
      const rootBox = document.getElementById("search_root_div");
      rootBox.classList.add("search_root_in");
      document.getElementById("ymTonny_find_text").focus();
    }
  };
  selectElementContents(el) {
    if (window.getSelection && document.createRange) {
      // IE 9
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (document.body.createTextRange) {
      // IE < 9
      const textRange = document.body.createTextRange();
      textRange.moveToElementText(el);
      textRange.select();
    }
  }
}
