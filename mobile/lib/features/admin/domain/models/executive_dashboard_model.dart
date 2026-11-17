class ExecutiveDashboardModel {
  final DashboardFinancials financials;
  final DashboardPipeline pipeline;
  final DashboardDelivery delivery;
  final DashboardWorkforce workforce;

  const ExecutiveDashboardModel({
    required this.financials,
    required this.pipeline,
    required this.delivery,
    required this.workforce,
  });

  factory ExecutiveDashboardModel.fromJson(Map<String, dynamic> json) {
    return ExecutiveDashboardModel(
      financials: DashboardFinancials.fromJson(json['financials'] as Map<String, dynamic>? ?? {}),
      pipeline: DashboardPipeline.fromJson(json['pipeline'] as Map<String, dynamic>? ?? {}),
      delivery: DashboardDelivery.fromJson(json['delivery'] as Map<String, dynamic>? ?? {}),
      workforce: DashboardWorkforce.fromJson(json['workforce'] as Map<String, dynamic>? ?? {}),
    );
  }

  factory ExecutiveDashboardModel.empty() {
    return const ExecutiveDashboardModel(
      financials: DashboardFinancials(
        totalCollected: 0,
        totalInvoiced: 0,
        outstandingDue: 0,
        monthlyRecurringRevenue: 0,
      ),
      pipeline: DashboardPipeline(
        openDealsCount: 0,
        wonDealsCount: 0,
        totalOpenPipeline: 0,
        totalWonRevenue: 0,
        winRate: 0,
      ),
      delivery: DashboardDelivery(
        totalProjects: 0,
        activeProjects: 0,
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        ticketSlaRate: 100,
      ),
      workforce: DashboardWorkforce(
        totalHeadcount: 0,
        monthlyGrossPayroll: 0,
      ),
    );
  }
}

class DashboardFinancials {
  final double totalCollected;
  final double totalInvoiced;
  final double outstandingDue;
  final double monthlyRecurringRevenue;

  const DashboardFinancials({
    required this.totalCollected,
    required this.totalInvoiced,
    required this.outstandingDue,
    required this.monthlyRecurringRevenue,
  });

  factory DashboardFinancials.fromJson(Map<String, dynamic> json) {
    return DashboardFinancials(
      totalCollected: (json['totalCollected'] as num?)?.toDouble() ?? 0.0,
      totalInvoiced: (json['totalInvoiced'] as num?)?.toDouble() ?? 0.0,
      outstandingDue: (json['outstandingDue'] as num?)?.toDouble() ?? 0.0,
      monthlyRecurringRevenue: (json['monthlyRecurringRevenue'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class DashboardPipeline {
  final int openDealsCount;
  final int wonDealsCount;
  final double totalOpenPipeline;
  final double totalWonRevenue;
  final int winRate;

  const DashboardPipeline({
    required this.openDealsCount,
    required this.wonDealsCount,
    required this.totalOpenPipeline,
    required this.totalWonRevenue,
    required this.winRate,
  });

  factory DashboardPipeline.fromJson(Map<String, dynamic> json) {
    return DashboardPipeline(
      openDealsCount: (json['openDealsCount'] as num?)?.toInt() ?? 0,
      wonDealsCount: (json['wonDealsCount'] as num?)?.toInt() ?? 0,
      totalOpenPipeline: (json['totalOpenPipeline'] as num?)?.toDouble() ?? 0.0,
      totalWonRevenue: (json['totalWonRevenue'] as num?)?.toDouble() ?? 0.0,
      winRate: (json['winRate'] as num?)?.toInt() ?? 0,
    );
  }
}

class DashboardDelivery {
  final int totalProjects;
  final int activeProjects;
  final int totalTickets;
  final int openTickets;
  final int resolvedTickets;
  final int ticketSlaRate;

  const DashboardDelivery({
    required this.totalProjects,
    required this.activeProjects,
    required this.totalTickets,
    required this.openTickets,
    required this.resolvedTickets,
    required this.ticketSlaRate,
  });

  factory DashboardDelivery.fromJson(Map<String, dynamic> json) {
    return DashboardDelivery(
      totalProjects: (json['totalProjects'] as num?)?.toInt() ?? 0,
      activeProjects: (json['activeProjects'] as num?)?.toInt() ?? 0,
      totalTickets: (json['totalTickets'] as num?)?.toInt() ?? 0,
      openTickets: (json['openTickets'] as num?)?.toInt() ?? 0,
      resolvedTickets: (json['resolvedTickets'] as num?)?.toInt() ?? 0,
      ticketSlaRate: (json['ticketSlaRate'] as num?)?.toInt() ?? 100,
    );
  }
}

class DashboardWorkforce {
  final int totalHeadcount;
  final double monthlyGrossPayroll;

  const DashboardWorkforce({
    required this.totalHeadcount,
    required this.monthlyGrossPayroll,
  });

  factory DashboardWorkforce.fromJson(Map<String, dynamic> json) {
    return DashboardWorkforce(
      totalHeadcount: (json['totalHeadcount'] as num?)?.toInt() ?? 0,
      monthlyGrossPayroll: (json['monthlyGrossPayroll'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
