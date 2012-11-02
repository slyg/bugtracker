module.exports = (function(){

	var bugSnapshotSchema = new mongoose.Schema({
		created_at : Date,
		count : Number
	});

	return {
		bugSnapshot = db.model('bubSnapshot', bugSnapshotSchema);
	}

}());
