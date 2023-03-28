import { IdleQueue } from 'idlize/IdleQueue.mjs';

class QuillIdleQueue extends IdleQueue {
	queueTasks(...seriesTasks) {
		let task = null;
		while(seriesTasks.length > 0) {
			task = seriesTasks.pop();
			this.unshiftTask(task);
		}
	}

	resetQueue() {
		this.state_ = null;
		this.isProcessing_ = false;
		this.clearPendingTasks();
	}
}

export default new QuillIdleQueue();