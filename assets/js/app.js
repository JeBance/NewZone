const config = {};
const NODES = new nodes();

loader.show = () => {
	loader.className = 'flex transparentBackground';
	loader.style.width = loginArea.offsetWidth + 'px';
	loader.style.height = loginArea.offsetHeight + 'px';
	loader.style.top = loginArea.offsetTop + 'px';
	loader.style.left = loginArea.offsetLeft + 'px';
}

let fillingNodeNetsSelectionOtions = setInterval(async () => {
	if (NODES.nets !== undefined){
		for (let value of NODES.nets) {
			selectNode.append(new Option(value, value));
		}
		clearInterval(fillingNodeNetsSelectionOtions);
		loader.hide();
	}
}, 1000);

async function wrap(elem) {
	switch(elem.id) {
		case 'buttonStart':
			buttonStart.hide();
			NODES.cyclicNodesCheck();
			selectNodeBlock.className = 'flex block';
			loader.show();
			fillingNodeNetsSelectionOtions;
			break;

		case 'buttonSelectNode':
			config.net = selectNode.value;
			selectNodeBlock.hide();
//			selectNodeBlock.className = 'flex block';
//			loader.show();
			break;

		default:
			break;
	}
}
