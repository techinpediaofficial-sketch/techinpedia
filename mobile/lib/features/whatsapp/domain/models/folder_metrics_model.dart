class FolderMetricsModel {
  final int all;
  final int myChats;
  final int unassigned;
  final int unread;
  final int waitingCustomer;
  final int highPriority;
  final int closed;

  const FolderMetricsModel({
    this.all = 0,
    this.myChats = 0,
    this.unassigned = 0,
    this.unread = 0,
    this.waitingCustomer = 0,
    this.highPriority = 0,
    this.closed = 0,
  });

  int get total => all;
  int get mine => myChats;
  int get open => all > closed ? (all - closed) : all;

  factory FolderMetricsModel.fromJson(Map<String, dynamic> json) {
    return FolderMetricsModel(
      all: (json['ALL'] as num?)?.toInt() ?? 0,
      myChats: (json['MY_CHATS'] as num?)?.toInt() ?? 0,
      unassigned: (json['UNASSIGNED'] as num?)?.toInt() ?? 0,
      unread: (json['UNREAD'] as num?)?.toInt() ?? 0,
      waitingCustomer: (json['WAITING_CUSTOMER'] as num?)?.toInt() ?? 0,
      highPriority: (json['HIGH_PRIORITY'] as num?)?.toInt() ?? 0,
      closed: (json['CLOSED'] as num?)?.toInt() ?? 0,
    );
  }
}
